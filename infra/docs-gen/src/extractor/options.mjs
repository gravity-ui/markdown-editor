import {OPTIONS_DECL_RE, OPTION_FIELD_RE} from './patterns.mjs';
import {
    readBalanced,
    readExpression,
    resetPattern,
    skipWhitespace,
    splitTopLevelBy,
} from './regex.mjs';

/**
 * Normalizes whitespace in extracted type snippets.
 */
function normalizeWhitespace(content) {
    return content.trim().replace(/\s+/g, ' ');
}

/**
 * Removes TypeScript comments from a declaration body.
 */
function stripTypeComments(content) {
    return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/**
 * Trims syntax left by top-level field splitting.
 */
function trimFieldType(content) {
    return normalizeWhitespace(content.replace(/[;,]\s*$/u, ''));
}

/**
 * Parses fields from an inline object type body.
 */
function parseOptionFieldsFromBody(body) {
    const fields = [];
    const cleanBody = stripTypeComments(body);

    for (const segment of splitTopLevelBy(cleanBody, [';', ','], {trackAngles: true})) {
        const fieldMatch = OPTION_FIELD_RE.exec(segment.trim());
        if (!fieldMatch) continue;

        fields.push({
            name: fieldMatch[1],
            type: trimFieldType(fieldMatch[2]),
        });
    }

    return fields;
}

/**
 * Creates a type declaration record.
 */
function createOptionDeclaration(name, kind, expression, body, endIndex) {
    return {
        name,
        kind,
        expression,
        body,
        endIndex,
    };
}

/**
 * Reads an exported interface declaration.
 */
function readInterfaceDeclaration(content, name, cursor) {
    const bodyStart = content.indexOf('{', cursor);
    if (bodyStart === -1) return null;

    const body = readBalanced(content, bodyStart, '{', '}');
    if (!body) return null;

    return createOptionDeclaration(
        name,
        'interface',
        content.slice(cursor, bodyStart).trim(),
        body.body,
        body.endIndex,
    );
}

/**
 * Finds the alias assignment after optional generic parameters.
 */
function findTypeAliasEquals(content, cursor) {
    let angleDepth = 0;
    let quote = null;
    let inBlockComment = false;
    let inLineComment = false;

    for (let index = cursor; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];

        if (inLineComment) {
            if (char === '\n') inLineComment = false;
            continue;
        }

        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false;
                index++;
            }
            continue;
        }

        if (quote) {
            if (char === '\\') {
                index++;
                continue;
            }
            if (char === quote) quote = null;
            continue;
        }

        if (char === '/' && next === '/') {
            inLineComment = true;
            index++;
            continue;
        }

        if (char === '/' && next === '*') {
            inBlockComment = true;
            index++;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }

        if (char === '<') angleDepth++;
        else if (char === '>' && content[index - 1] !== '=' && angleDepth > 0) angleDepth--;
        else if (char === '=' && angleDepth === 0) return index;
        else if (char === ';' && angleDepth === 0) return -1;
    }

    return -1;
}

/**
 * Reads an exported type alias declaration.
 */
function readTypeDeclaration(content, name, cursor) {
    const equalsIndex = findTypeAliasEquals(content, cursor);
    if (equalsIndex === -1) return null;

    const expressionStart = skipWhitespace(content, equalsIndex + 1);
    const expression = readExpression(content, expressionStart, [';']);
    return createOptionDeclaration(name, 'type', expression.body, null, expression.endIndex);
}

/**
 * Reads an exported options declaration.
 */
function readOptionDeclaration(content, match) {
    const [, kind, name] = match;
    const cursor = match.index + match[0].length;

    return kind === 'interface'
        ? readInterfaceDeclaration(content, name, cursor)
        : readTypeDeclaration(content, name, cursor);
}

/**
 * Parses exported *Options declarations.
 */
function parseOptionDeclarations(content) {
    const declarations = new Map();
    const re = resetPattern(OPTIONS_DECL_RE);
    let match;

    while ((match = re.exec(content))) {
        const declaration = readOptionDeclaration(content, match);
        if (!declaration) continue;

        declarations.set(declaration.name, declaration);
        re.lastIndex = declaration.endIndex + 1;
    }

    return declarations;
}

/**
 * Deduplicates option fields by name.
 */
function uniqueOptionFields(fields) {
    const result = new Map();

    for (const field of fields) {
        if (!result.has(field.name)) {
            result.set(field.name, field);
        }
    }

    return [...result.values()];
}

/**
 * Removes wrapping parentheses from a type expression.
 */
function unwrapTypeExpression(expression) {
    const trimmed = expression.trim();
    if (!trimmed.startsWith('(')) return trimmed;

    const body = readBalanced(trimmed, 0, '(', ')');
    if (!body || body.endIndex !== trimmed.length - 1) return trimmed;

    return unwrapTypeExpression(body.body);
}

/**
 * Reads an inline object type expression.
 */
function readObjectTypeFields(expression) {
    const trimmed = expression.trim();
    if (!trimmed.startsWith('{')) return null;

    const body = readBalanced(trimmed, 0, '{', '}');
    if (!body) return null;

    return parseOptionFieldsFromBody(body.body);
}

/**
 * Extracts a plain type reference name.
 */
function extractTypeReferenceName(expression) {
    const match = /^([A-Za-z_$][\w$]*)\b(?:<[\s\S]*>)?$/u.exec(expression.trim());
    return match?.[1] || null;
}

/**
 * Parses utility type arguments.
 */
function parseUtilityTypeArguments(expression, utilityName) {
    const trimmed = expression.trim();
    const prefix = `${utilityName}<`;
    if (!trimmed.startsWith(prefix)) return null;

    const body = readBalanced(trimmed, utilityName.length, '<', '>');
    if (!body || body.endIndex !== trimmed.length - 1) return null;

    return splitTopLevelBy(body.body, [','], {trackAngles: true});
}

/**
 * Extracts string literal names from a union type.
 */
function parseFieldNameUnion(expression) {
    return splitTopLevelBy(expression, ['|'], {trackAngles: true})
        .map((part) => part.trim())
        .map((part) => {
            const match = /^['"]([^'"]+)['"]$/u.exec(part);
            return match?.[1] || null;
        })
        .filter(Boolean);
}

/**
 * Filters fields to names from a utility type.
 */
function pickOptionFields(fields, names) {
    const allowedNames = new Set(names);
    return fields.filter((field) => allowedNames.has(field.name));
}

/**
 * Excludes fields by names from a utility type.
 */
function omitOptionFields(fields, names) {
    const omittedNames = new Set(names);
    return fields.filter((field) => !omittedNames.has(field.name));
}

/**
 * Resolves a Pick<T, K> type expression.
 */
function resolvePickExpression(expression, declarations, seen) {
    const args = parseUtilityTypeArguments(expression, 'Pick');
    if (!args || args.length < 2) return null;

    const fields = resolveTypeExpression(args[0], declarations, seen);
    return pickOptionFields(fields, parseFieldNameUnion(args[1]));
}

/**
 * Resolves an Omit<T, K> type expression.
 */
function resolveOmitExpression(expression, declarations, seen) {
    const args = parseUtilityTypeArguments(expression, 'Omit');
    if (!args || args.length < 2) return null;

    const fields = resolveTypeExpression(args[0], declarations, seen);
    return omitOptionFields(fields, parseFieldNameUnion(args[1]));
}

/**
 * Resolves a type reference to another local declaration.
 */
function resolveTypeReference(expression, declarations, seen) {
    const typeName = extractTypeReferenceName(expression);
    if (!typeName || !declarations.has(typeName)) return null;

    return resolveOptionDeclaration(typeName, declarations, seen);
}

/**
 * Resolves supported TypeScript option type expressions.
 */
function resolveTypeExpression(expression, declarations, seen) {
    const trimmed = unwrapTypeExpression(expression);
    if (!trimmed) return [];

    const intersectionParts = splitTopLevelBy(trimmed, ['&'], {trackAngles: true});
    if (intersectionParts.length > 1) {
        return intersectionParts.flatMap((part) => resolveTypeExpression(part, declarations, seen));
    }

    return (
        readObjectTypeFields(trimmed) ||
        resolvePickExpression(trimmed, declarations, seen) ||
        resolveOmitExpression(trimmed, declarations, seen) ||
        resolveTypeReference(trimmed, declarations, seen) ||
        []
    );
}

/**
 * Resolves an interface extends clause.
 */
function resolveInterfaceExtends(expression, declarations, seen) {
    const trimmed = expression.trim();
    if (!trimmed.startsWith('extends ')) return [];

    return resolveTypeExpression(trimmed.slice('extends '.length), declarations, seen);
}

/**
 * Resolves fields from a declaration by name.
 */
function resolveOptionDeclaration(name, declarations, seen = new Set()) {
    if (seen.has(name)) return [];
    seen.add(name);

    const declaration = declarations.get(name);
    if (!declaration) return [];

    const inheritedFields =
        declaration.kind === 'interface'
            ? resolveInterfaceExtends(declaration.expression, declarations, seen)
            : resolveTypeExpression(declaration.expression, declarations, seen);
    const ownFields = declaration.body ? parseOptionFieldsFromBody(declaration.body) : [];

    return uniqueOptionFields([...inheritedFields, ...ownFields]);
}

/**
 * Selects preferred option declaration names.
 */
function selectOptionNames(declarations, preferredNames) {
    const existingPreferredNames = preferredNames.filter((name) => declarations.has(name));
    return existingPreferredNames.length > 0 ? existingPreferredNames : [...declarations.keys()];
}

/**
 * Extracts exported extension options fields.
 */
export function extractOptionsType(content, preferredNames = []) {
    const declarations = parseOptionDeclarations(content);

    for (const name of selectOptionNames(declarations, preferredNames)) {
        const fields = resolveOptionDeclaration(name, declarations);
        if (fields.length > 0) return fields;
    }

    return [];
}

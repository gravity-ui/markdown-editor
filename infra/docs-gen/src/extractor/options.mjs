import ts from 'typescript';

import {getStaticPropertyName, parseSource} from './ast.mjs';

/**
 * Normalizes whitespace in extracted type snippets.
 */
function normalizeWhitespace(content) {
    return content.trim().replace(/\s+/g, ' ');
}

/**
 * Creates a type declaration record.
 */
function createDeclaration(name, kind, node, sourceFile) {
    return {
        name,
        kind,
        node,
        sourceFile,
    };
}

/**
 * Parses local *Options declarations from TypeScript source.
 */
function parseOptionDeclarations(content) {
    const sourceFile = parseSource(content);
    const declarations = new Map();

    for (const statement of sourceFile.statements) {
        if (
            (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
            statement.name.text.endsWith('Options')
        ) {
            declarations.set(
                statement.name.text,
                createDeclaration(
                    statement.name.text,
                    ts.isInterfaceDeclaration(statement) ? 'interface' : 'type',
                    statement,
                    sourceFile,
                ),
            );
        }
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
 * Reads a field type as source text.
 */
function readFieldType(member, sourceFile) {
    return member.type ? normalizeWhitespace(member.type.getText(sourceFile)) : 'unknown';
}

/**
 * Reads field names from Pick/Omit string literal unions.
 */
function readStringLiteralUnion(typeNode) {
    if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteralLike(typeNode.literal)) {
        return [typeNode.literal.text];
    }

    if (ts.isUnionTypeNode(typeNode)) {
        return typeNode.types.flatMap(readStringLiteralUnion);
    }

    return [];
}

/**
 * Reads fields declared inside an inline object type.
 */
function readTypeLiteralFields(typeLiteral, sourceFile) {
    const fields = [];

    for (const member of typeLiteral.members) {
        if (!ts.isPropertySignature(member) || !member.name) continue;

        const name = getStaticPropertyName(member.name);
        if (!name) continue;

        fields.push({
            name,
            type: readFieldType(member, sourceFile),
        });
    }

    return fields;
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
 * Resolves a type reference to another local declaration or utility type.
 */
function resolveTypeReference(typeNode, declarations, seen, sourceFile) {
    const typeName = typeNode.typeName.getText(sourceFile);
    const typeArguments = typeNode.typeArguments || [];

    if ((typeName === 'Pick' || typeName === 'Omit') && typeArguments.length >= 2) {
        const fields = resolveTypeNode(typeArguments[0], declarations, seen, sourceFile);
        const names = readStringLiteralUnion(typeArguments[1]);

        return typeName === 'Pick'
            ? pickOptionFields(fields, names)
            : omitOptionFields(fields, names);
    }

    if (!declarations.has(typeName)) return [];

    return resolveOptionDeclaration(typeName, declarations, seen);
}

/**
 * Resolves supported TypeScript option type nodes.
 */
function resolveTypeNode(typeNode, declarations, seen, sourceFile) {
    if (!typeNode) return [];

    if (ts.isParenthesizedTypeNode(typeNode)) {
        return resolveTypeNode(typeNode.type, declarations, seen, sourceFile);
    }

    if (ts.isTypeLiteralNode(typeNode)) {
        return readTypeLiteralFields(typeNode, sourceFile);
    }

    if (ts.isIntersectionTypeNode(typeNode)) {
        return typeNode.types.flatMap((part) =>
            resolveTypeNode(part, declarations, seen, sourceFile),
        );
    }

    if (ts.isTypeReferenceNode(typeNode)) {
        return resolveTypeReference(typeNode, declarations, seen, sourceFile);
    }

    return [];
}

/**
 * Resolves fields inherited by an interface declaration.
 */
function resolveInterfaceHeritage(interfaceNode, declarations, seen, sourceFile) {
    const clauses = interfaceNode.heritageClauses || [];
    const fields = [];

    for (const clause of clauses) {
        if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;

        for (const type of clause.types) {
            const typeName = type.expression.getText(sourceFile);
            if (!declarations.has(typeName)) continue;

            fields.push(...resolveOptionDeclaration(typeName, declarations, seen));
        }
    }

    return fields;
}

/**
 * Resolves fields from a declaration by name.
 */
function resolveOptionDeclaration(name, declarations, seen = new Set()) {
    if (seen.has(name)) return [];
    seen.add(name);

    const declaration = declarations.get(name);
    if (!declaration) return [];

    const {node, sourceFile} = declaration;
    const inheritedFields = ts.isInterfaceDeclaration(node)
        ? resolveInterfaceHeritage(node, declarations, seen, sourceFile)
        : resolveTypeNode(node.type, declarations, seen, sourceFile);
    const ownFields = ts.isInterfaceDeclaration(node)
        ? readTypeLiteralFields(node, sourceFile)
        : [];

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

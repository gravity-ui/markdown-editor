/**
 * English: Reads and transforms option field descriptors from TypeScript type nodes.
 *
 * Русский: Читает и преобразует descriptors option fields из TypeScript type nodes.
 */
import ts from 'typescript';

import {getStaticPropertyName} from '../ast.mjs';

/**
 * Checks whether a character is a whitespace separator.
 */
function isWhitespace(char) {
    return char === ' ' || char === '\n' || char === '\r' || char === '\t' || char === '\f';
}

/**
 * Normalizes whitespace in extracted type snippets.
 */
function normalizeWhitespace(content) {
    const trimmed = content.trim();
    let result = '';
    let isInsideWhitespace = false;

    for (const char of trimmed) {
        if (isWhitespace(char)) {
            if (!isInsideWhitespace) {
                result += ' ';
            }
            isInsideWhitespace = true;
        } else {
            result += char;
            isInsideWhitespace = false;
        }
    }

    return result;
}

/**
 * Deduplicates option fields by name.
 */
export function uniqueOptionFields(fields) {
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
export function readStringLiteralUnion(typeNode) {
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
export function readTypeLiteralFields(typeLiteral, sourceFile) {
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
export function pickOptionFields(fields, names) {
    const allowedNames = new Set(names);
    return fields.filter((field) => allowedNames.has(field.name));
}

/**
 * Excludes fields by names from a utility type.
 */
export function omitOptionFields(fields, names) {
    const omittedNames = new Set(names);
    return fields.filter((field) => !omittedNames.has(field.name));
}

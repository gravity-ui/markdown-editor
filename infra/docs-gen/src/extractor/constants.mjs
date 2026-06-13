import ts from 'typescript';

import {
    forEachNode,
    getExpressionName,
    getStaticPropertyName,
    getStringValue,
    parseSource,
    unwrapExpression,
} from './ast.mjs';

/**
 * Resolves a scalar initializer into a literal value or constant reference.
 */
function readScalarInitializer(initializer, sourceFile) {
    const stringValue = getStringValue(initializer);
    if (stringValue !== null) return stringValue;

    const current = unwrapExpression(initializer);
    if (ts.isIdentifier(current) || ts.isPropertyAccessExpression(current)) {
        return getExpressionName(current, sourceFile);
    }

    return null;
}

/**
 * Extracts top-level scalar members from an object literal.
 */
function extractObjectScalarMembers(objectName, objectLiteral, constants, sourceFile) {
    for (const property of objectLiteral.properties) {
        if (!ts.isPropertyAssignment(property)) continue;

        const key = getStaticPropertyName(property.name);
        if (!key) continue;

        const value = readScalarInitializer(property.initializer, sourceFile);
        if (value !== null) {
            constants.set(`${objectName}.${key}`, value);
        }
    }
}

/**
 * Extracts a scalar const declaration.
 */
function extractVariableDeclaration(declaration, constants, sourceFile) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) return;

    const name = declaration.name.text;
    const initializer = unwrapExpression(declaration.initializer);

    if (ts.isObjectLiteralExpression(initializer)) {
        extractObjectScalarMembers(name, initializer, constants, sourceFile);
        return;
    }

    const value = readScalarInitializer(initializer, sourceFile);
    if (value !== null) {
        constants.set(name, value);
    }
}

/**
 * Extracts string-valued enum members.
 */
function extractEnumDeclaration(enumDeclaration, constants) {
    const enumName = enumDeclaration.name.text;

    for (const member of enumDeclaration.members) {
        const memberName = getStaticPropertyName(member.name);
        if (!memberName || !member.initializer) continue;

        const value = getStringValue(member.initializer);
        if (value !== null) {
            constants.set(`${enumName}.${memberName}`, value);
        }
    }
}

/**
 * Resolves aliases between constants after all candidates are collected.
 */
function resolveConstantAliases(constants) {
    for (let pass = 0; pass < 5; pass++) {
        for (const [key, value] of constants) {
            if (typeof value === 'string' && constants.has(value) && key !== value) {
                constants.set(key, constants.get(value));
            }
        }
    }
}

/**
 * Extracts string-valued constants, enums, and scalar object members.
 */
export function extractConstants(content) {
    const sourceFile = parseSource(content);
    const constants = new Map();

    forEachNode(sourceFile, (node) => {
        if (ts.isVariableDeclaration(node)) {
            extractVariableDeclaration(node, constants, sourceFile);
        } else if (ts.isEnumDeclaration(node)) {
            extractEnumDeclaration(node, constants);
        }
    });

    resolveConstantAliases(constants);

    return constants;
}

/**
 * Resolves one raw identifier through the constants map.
 */
export function resolveConstant(raw, constants) {
    if (!raw) return raw;
    if (constants.has(raw)) return constants.get(raw);

    for (const [key, value] of constants) {
        if (key.endsWith(`.${raw}`) || key === raw) return value;
    }

    return raw;
}

/**
 * Resolves a list of raw identifiers and expands constant namespaces.
 */
export function resolveAllConstants(rawList, constants) {
    const resolved = [];

    for (const raw of rawList) {
        const value = resolveConstant(raw, constants);

        if (value === raw && constants.size > 0) {
            const prefix = raw + '.';
            const members = [];
            for (const [key, memberValue] of constants) {
                if (key.startsWith(prefix)) members.push(resolveConstant(memberValue, constants));
            }

            if (members.length > 0) {
                resolved.push(...members);
                continue;
            }
        }

        resolved.push(value);
    }

    return [...new Set(resolved)];
}

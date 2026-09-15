/**
 * English: Resolves local option declarations into flat field lists.
 *
 * Русский: Резолвит локальные option declarations в плоские списки fields.
 */
import ts from 'typescript';

import {
    omitOptionFields,
    pickOptionFields,
    readStringLiteralUnion,
    readTypeLiteralFields,
    uniqueOptionFields,
} from './fields.mjs';

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
export function resolveOptionDeclaration(name, declarations, seen = new Set()) {
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

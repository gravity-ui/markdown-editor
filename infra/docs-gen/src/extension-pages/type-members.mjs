import ts from 'typescript';

import {documentedItem, jsDocLines} from './jsdoc.mjs';
import {inlineText} from './markdown.mjs';
import {compareStrings, hasFlag} from './utils.mjs';

const printer = ts.createPrinter({removeComments: true});

/** Prints a type node on one line without comments. */
function printType(node, file) {
    return inlineText(printer.printNode(ts.EmitHint.Unspecified, node, file));
}

/** Reads the written type of a member: a method keeps its whole call signature. */
function memberType(checker, symbol, declaration) {
    if (declaration && ts.isMethodSignature(declaration)) {
        const callable = ts.factory.createFunctionTypeNode(
            declaration.typeParameters,
            declaration.parameters,
            declaration.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
        );
        return printType(callable, declaration.getSourceFile());
    }
    if (declaration?.type) return printType(declaration.type, declaration.getSourceFile());

    return checker.typeToString(checker.getTypeOfSymbol(symbol));
}

/** Renders one property as `name?: type` with its JSDoc. */
function propertyItem(checker, symbol) {
    const declaration = symbol.declarations?.[0];
    const optional = hasFlag(symbol.flags, ts.SymbolFlags.Optional) ? '?' : '';
    const signature = `${symbol.name}${optional}: ${memberType(checker, symbol, declaration)}`;

    return documentedItem(signature, declaration ? jsDocLines(declaration) : []);
}

const OBJECT_FLAGS = [ts.TypeFlags.Object, ts.TypeFlags.Intersection, ts.TypeFlags.Union];

/** Checks that a type is an object type: primitives and arrays are not. */
function isObjectType(checker, type) {
    const types = type.isUnion() ? type.types : [type];

    return types.every(
        (part) =>
            OBJECT_FLAGS.some((flag) => hasFlag(part.flags, flag)) &&
            !checker.isArrayType(part) &&
            !checker.isTupleType(part),
    );
}

/** Prints a type as written in its project alias, or as the checker names it. */
function writtenType(checker, type) {
    const alias = type.aliasSymbol?.declarations?.[0];
    if (alias && ts.isTypeAliasDeclaration(alias) && !alias.getSourceFile().isDeclarationFile) {
        return printType(alias.type, alias.getSourceFile());
    }

    return checker.typeToString(type);
}

/** Checks that a property is declared in the shared interface. */
function isSharedProperty(symbol, shared) {
    return (symbol.declarations ?? []).some(({parent}) => {
        return (
            ts.isInterfaceDeclaration(parent) &&
            parent.name.text === shared.name &&
            parent.getSourceFile().fileName.endsWith(`/${shared.file}`)
        );
    });
}

/**
 * Renders the properties of a type sorted by name; `undefined` and `null` are removed first.
 * Properties of the shared interface give one line with the interface name.
 * A type without named properties is printed as written.
 */
export function optionsList(checker, type, shared = null) {
    const objectType = type && checker.getNonNullableType(type);
    if (!objectType) return [];

    const properties = isObjectType(checker, objectType)
        ? checker.getPropertiesOfType(objectType).sort((a, b) => compareStrings(a.name, b.name))
        : [];
    if (properties.length === 0) return [`\`${writtenType(checker, objectType)}\``];

    const own = properties.filter((symbol) => !shared || !isSharedProperty(symbol, shared));
    const sharedLine = own.length < properties.length ? [shared.line] : [];

    return [...own.flatMap((symbol) => propertyItem(checker, symbol)), ...sharedLine];
}

/** Reads the type of a parameter from the first call signature that has it; unions are searched by member. */
export function parameterType(checker, type, position, location) {
    const types = type?.isUnion() ? type.types : [type];
    const parameter = types
        .filter(Boolean)
        .flatMap((part) => part.getCallSignatures())
        .map((signature) => signature.parameters[position])
        .find(Boolean);

    return parameter ? checker.getTypeOfSymbolAtLocation(parameter, location) : null;
}

import ts from 'typescript';

import {compareStrings} from './utils.mjs';

/** Checks that a module specifier names a package: not relative and not a path alias. */
function isPackageSpecifier(specifier, pathAliases) {
    if (specifier.startsWith('.')) return false;

    return !pathAliases.some((alias) =>
        alias.endsWith('*') ? specifier.startsWith(alias.slice(0, -1)) : specifier === alias,
    );
}

/** Reads the import binding of an identifier: its module specifier and the imported name. */
export function importBinding(index, identifier) {
    const declaration = index.checker.getSymbolAtLocation(identifier)?.declarations?.[0];
    const importDeclaration = declaration && ts.findAncestor(declaration, ts.isImportDeclaration);
    if (!importDeclaration) return null;

    const specifier = importDeclaration.moduleSpecifier.text;
    const binding = {specifier, isPackage: isPackageSpecifier(specifier, index.pathAliases)};
    if (ts.isImportClause(declaration))
        return {...binding, kind: 'default', text: declaration.name.text};
    if (ts.isNamespaceImport(declaration)) {
        return {...binding, kind: 'namespace', text: `* as ${declaration.name.text}`};
    }
    if (ts.isImportSpecifier(declaration)) {
        const imported = declaration.propertyName ? `${declaration.propertyName.text} as ` : '';
        return {...binding, kind: 'named', text: `${imported}${declaration.name.text}`};
    }

    return null;
}

/** Renders import declarations sorted by text; named bindings of one module share a declaration. */
export function importLines(bindings) {
    const named = new Map();
    const lines = new Set();
    for (const {specifier, kind, text} of bindings) {
        if (kind === 'named')
            named.set(specifier, new Set([...(named.get(specifier) ?? []), text]));
        else lines.add(`import ${text} from '${specifier}';`);
    }
    for (const [specifier, names] of named) {
        lines.add(`import {${[...names].sort(compareStrings).join(', ')}} from '${specifier}';`);
    }

    return [...lines].sort(compareStrings);
}

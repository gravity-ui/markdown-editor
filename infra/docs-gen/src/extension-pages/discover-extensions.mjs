import {existsSync, readdirSync} from 'node:fs';
import {basename, join} from 'node:path';

import {sourceDir} from './packages.mjs';
import {resolveAlias} from './symbols.mjs';
import {compareStrings} from './utils.mjs';

/** Lists indexed source files placed directly in a directory; `index` files go first. */
function filesInDirectory(index, dir) {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
        .filter((file) => /\.(ts|tsx)$/.test(file))
        .sort(
            (a, b) =>
                Number(!a.startsWith('index.')) - Number(!b.startsWith('index.')) ||
                compareStrings(a, b),
        )
        .map((file) => index.files.get(join(dir, file)))
        .filter(Boolean);
}

/** Checks that a symbol is a function whose first parameter has the `ExtensionBuilder` type. */
function isExtensionFunction(checker, symbol, location) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, location);

    return type.getCallSignatures().some((signature) => {
        const [builder] = signature.parameters;
        const builderType = builder && checker.getTypeOfSymbolAtLocation(builder, location);

        return builderType?.getSymbol()?.getName() === 'ExtensionBuilder';
    });
}

/** Lists the extension functions a file exports, through re-exports; `local` keeps the ones declared in the file. */
function exportedExtensions(index, file, local = false) {
    const {checker} = index;
    const moduleSymbol = checker.getSymbolAtLocation(file);
    if (!moduleSymbol) return [];

    return checker
        .getExportsOfModule(moduleSymbol)
        .filter((symbol) => {
            const target = resolveAlias(checker, symbol);
            return (
                target?.valueDeclaration &&
                (!local || target.valueDeclaration.getSourceFile() === file) &&
                isExtensionFunction(checker, target, file)
            );
        })
        .map((symbol) => symbol.name);
}

/**
 * Finds the extension of a directory. The page is named after the directory.
 * The export is the one named after the directory, or the only extension function of the directory.
 */
function readExtension(index, dir, expectedName = basename(dir)) {
    const preferred = [expectedName, `${expectedName}Extension`];
    const candidates = new Map();
    for (const file of filesInDirectory(index, dir)) {
        const names = exportedExtensions(index, file);
        const exportName = preferred.find((name) => names.includes(name));
        if (exportName) return {name: exportName, exportName, file, dir};
        for (const name of names) {
            if (!candidates.has(name)) candidates.set(name, file);
        }
    }

    if (candidates.size !== 1) return null;
    const [[exportName, file]] = candidates;
    return {name: expectedName, exportName, file, dir};
}

/** Lists extensions declared in a category `index.ts`. */
function categoryExtensions(index, categoryDir) {
    const file = index.files.get(join(categoryDir, 'index.ts'));
    const names = file ? exportedExtensions(index, file, true) : [];

    return names.map((name) => ({name, exportName: name, file}));
}

/** Lists extension directories of a category; an absent category has none. */
function extensionDirectories(categoryDir) {
    if (!existsSync(categoryDir)) return [];

    return readdirSync(categoryDir, {withFileTypes: true})
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(categoryDir, entry.name));
}

/** Finds the extensions of one package by its discovery rule. */
function packageExtensions(index, descriptor) {
    const {discovery} = descriptor;
    const srcDir = sourceDir(descriptor);
    if (discovery.extensions) {
        return discovery.extensions.map(({dir, name}) =>
            readExtension(index, join(srcDir, dir), name),
        );
    }

    const exclude = new Set(discovery.exclude);
    return discovery.categories
        .flatMap((category) => {
            const categoryDir = join(srcDir, discovery.categoriesDir, category);
            return [
                ...categoryExtensions(index, categoryDir),
                ...extensionDirectories(categoryDir).map((dir) => readExtension(index, dir)),
            ];
        })
        .filter((extension) => extension && !exclude.has(extension.name));
}

/**
 * Finds one public extension for each extension directory of every package.
 * An extension declared in a category `index.ts` has no `dir`.
 */
export function discoverExtensions(index, packages) {
    return packages
        .flatMap((descriptor) =>
            packageExtensions(index, descriptor)
                .filter(Boolean)
                .map((extension) => ({...extension, package: descriptor})),
        )
        .sort((a, b) => compareStrings(a.name, b.name));
}

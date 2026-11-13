import {join} from 'node:path';

import ts from 'typescript';

import {sourceDir} from './packages.mjs';

/** Reads the `tsconfig.json` of the package that declares one, with its `extends` chain. */
function readConfig(packages) {
    const descriptor = packages.find(({tsconfig}) => tsconfig);
    return ts.getParsedCommandLineOfConfigFile(
        join(descriptor.dir, descriptor.tsconfig),
        {},
        {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic(diagnostic) {
                throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            },
        },
    );
}

/** Points package names to their sources: package builds are absent before the docs build. */
function packagePaths(packages) {
    return Object.fromEntries(
        packages.flatMap((descriptor) => [
            [descriptor.name, [join(sourceDir(descriptor), 'index.ts')]],
            [`${descriptor.name}/*`, [join(sourceDir(descriptor), '*')]],
        ]),
    );
}

/** Creates one program for the sources of all packages. */
export function createExtensionProgram(packages) {
    const config = readConfig(packages);
    const otherFiles = packages
        .filter(({tsconfig}) => !tsconfig)
        .flatMap((descriptor) => ts.sys.readDirectory(sourceDir(descriptor), ['.ts', '.tsx']));

    return ts.createProgram({
        rootNames: [...config.fileNames, ...otherFiles],
        options: {
            ...config.options,
            noEmit: true,
            paths: {...config.options.paths, ...packagePaths(packages)},
        },
    });
}

/** Selects the package sources of the program: no declaration files and no tests. */
export function projectSourceFiles(program, packages) {
    const dirs = packages.map((descriptor) => sourceDir(descriptor) + '/');

    return program
        .getSourceFiles()
        .filter(
            (file) =>
                !file.isDeclarationFile &&
                dirs.some((dir) => file.fileName.startsWith(dir)) &&
                !/\.(test|spec)\.tsx?$/.test(file.fileName),
        );
}

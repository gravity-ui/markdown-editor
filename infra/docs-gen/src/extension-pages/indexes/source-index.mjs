import {join} from 'node:path';

import ts from 'typescript';

import {sourceDir} from '../packages.mjs';

import {collectBuilderCall} from './builder-calls.mjs';
import {collectConstant} from './constants.mjs';
import {collectDirectiveKey} from './directive-keys.mjs';
import {collectDirectiveSyntax} from './directive-syntax.mjs';
import {collectExtensionExport} from './extension-exports.mjs';
import {collectToolbarItem, toolbarItemsByAction} from './toolbar-items.mjs';
import {collectTypeFactory} from './type-factories.mjs';

const COMMON_COLLECTORS = [
    collectBuilderCall,
    collectConstant,
    collectDirectiveKey,
    collectExtensionExport,
    collectTypeFactory,
];

/** Maps the toolbar files and the directive syntax file of the packages to their collectors. */
function fileCollectors(packages) {
    const collectors = new Map();
    for (const descriptor of packages) {
        const srcDir = sourceDir(descriptor);
        for (const file of descriptor.toolbarFiles ?? []) {
            collectors.set(join(srcDir, file), [...COMMON_COLLECTORS, collectToolbarItem]);
        }
        if (descriptor.directiveFile) {
            collectors.set(join(srcDir, descriptor.directiveFile), [
                ...COMMON_COLLECTORS,
                collectDirectiveSyntax,
            ]);
        }
    }

    return collectors;
}

/** Visits every node of a file once and passes it to the collectors. */
function indexFile(index, file, collectors) {
    const context = {index, file};
    const visit = (node) => {
        for (const collect of collectors) collect(node, context);
        ts.forEachChild(node, visit);
    };
    visit(file);
}

/** Builds all indexes in one pass over the project files. */
export function buildSourceIndex(program, files, packages) {
    const index = {
        checker: program.getTypeChecker(),
        files: new Map(files.map((file) => [file.fileName, file])),
        pathAliases: Object.keys(program.getCompilerOptions().paths ?? {}),
        builderCalls: new Map(),
        constants: new Map(),
        directiveKeys: new Map(),
        directiveSyntax: new Map(),
        extensionExports: new Map(),
        keysets: new Map(),
        toolbarParts: new Map(),
        typeFactories: new Map(),
    };
    const collectors = fileCollectors(packages);
    for (const file of files) {
        indexFile(index, file, collectors.get(file.fileName) ?? COMMON_COLLECTORS);
    }
    index.toolbarItems = toolbarItemsByAction(index);

    return index;
}

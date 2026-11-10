import assert from 'node:assert/strict';
import {globSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';

import ts from 'typescript';

const packageDir = path.resolve(import.meta.dirname, '../..');
const {exports: packageExports} = JSON.parse(
    readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
);
const {config, error} = ts.readConfigFile(path.join(packageDir, 'tsconfig.json'), ts.sys.readFile);
assert.ifError(error);
const parsedConfig = ts.parseJsonConfigFileContent(config, ts.sys, packageDir);
assert.deepEqual(parsedConfig.errors, []);
const aliases = Object.keys(parsedConfig.options.paths ?? {}).map(
    (alias) => new RegExp(`^${alias.split('*').map(RegExp.escape).join('.*')}$`),
);

for (const [condition, format] of [
    ['import', 'esm'],
    ['require', 'cjs'],
]) {
    test(`should resolve local imports and re-exports in ${format} public declarations`, () => {
        const declarations = Object.entries(packageExports).flatMap(([subpath, target]) => {
            if (subpath.startsWith('./_/')) return [];
            const types = target[condition]?.types;
            if (!types) return [];
            const pattern = types.includes('*')
                ? `${types.slice(0, types.indexOf('*'))}**/*.d.ts`
                : types;
            const files = globSync(pattern, {cwd: packageDir});
            assert.ok(files.length > 0, `Missing declarations for ${subpath}: ${types}`);
            return files.map((file) => path.join(packageDir, file));
        });
        assert.ok(declarations.includes(path.join(packageDir, `build/${format}/index.d.ts`)));

        const program = ts.createProgram(declarations, {
            module: ts.ModuleKind.NodeNext,
            moduleResolution: ts.ModuleResolutionKind.NodeNext,
            skipLibCheck: false,
            noEmit: true,
        });
        const buildDir = path.join(packageDir, 'build', format) + path.sep;
        const diagnostics = [];
        for (const file of program.getSourceFiles()) {
            if (!file.fileName.startsWith(buildDir)) continue;
            const references = [];
            collectLocalReferences(file, references);
            const errors = program
                .getSemanticDiagnostics(file)
                .filter(({start}) =>
                    references.some(
                        (node) => start >= node.getStart(file) && start < node.getEnd(),
                    ),
                );
            diagnostics.push(...errors);
        }

        assert.equal(
            diagnostics.length,
            0,
            ts.formatDiagnostics(diagnostics, {
                getCanonicalFileName: (file) => file,
                getCurrentDirectory: () => packageDir,
                getNewLine: () => '\n',
            }),
        );
    });
}

function collectLocalReferences(node, references) {
    let module;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        module = node.moduleSpecifier;
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
        module = node.argument.literal;
    }
    if (
        module &&
        ts.isStringLiteral(module) &&
        (module.text.startsWith('.') || aliases.some((alias) => alias.test(module.text)))
    ) {
        references.push(node);
    }
    ts.forEachChild(node, (child) => collectLocalReferences(child, references));
}

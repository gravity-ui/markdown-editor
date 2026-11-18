import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';

const BUILD_DIR = fileURLToPath(new URL('../../build', import.meta.url));
const EDITOR_IMPORT =
    /(?:from |import |require\()['"](@gravity-ui\/markdown-editor(?:\/[^'"]*)?)['"]/g;

function editorImports(dir) {
    return readdirSync(dir, {recursive: true})
        .filter((file) => file.endsWith('.js'))
        .flatMap((file) => {
            const path = join(dir, file);
            const source = readFileSync(path, 'utf8');
            return [...source.matchAll(EDITOR_IMPORT)].map(([, specifier]) => ({path, specifier}));
        });
}

test('should resolve editor imports of the ESM build in Node.js', () => {
    const imports = editorImports(join(BUILD_DIR, 'esm'));
    assert.ok(imports.length > 0);
    for (const {path, specifier} of imports) {
        const url = import.meta.resolve(specifier, pathToFileURL(path));
        assert.ok(existsSync(fileURLToPath(url)), `${specifier} in ${path}`);
    }
});

test('should resolve editor imports of the CJS build in Node.js', () => {
    const imports = editorImports(join(BUILD_DIR, 'cjs'));
    assert.ok(imports.length > 0);
    for (const {path, specifier} of imports) {
        assert.doesNotThrow(
            () => createRequire(path).resolve(specifier),
            `${specifier} in ${path}`,
        );
    }
});

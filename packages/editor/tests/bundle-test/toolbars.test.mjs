import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';

import {build} from 'esbuild';

const localBuild = path.join(import.meta.dirname, 'build/toolbars');
const nodeModuleFallback = path.join(
    import.meta.dirname,
    '../esbuild-test/node-module-alias-fallback.js',
);
const forbiddenDependencies = {
    wysiwyg: [
        /build\/esm\/(?:modules\/toolbars|bundle\/toolbar)\/markup\//,
        /node_modules\/(?:@codemirror\/|codemirror\/)/,
        /build\/esm\/markup\//,
        /build\/esm\/extensions\/additional\/GPT\/MarkupGpt\//,
    ],
    markup: [
        /build\/esm\/(?:modules\/toolbars|bundle\/toolbar)\/wysiwyg\//,
        /prosemirror-/,
        /build\/esm\/core\/Editor\.js/,
        /build\/esm\/extensions\/(?:base|behavior|markdown)\//,
        /build\/esm\/extensions\/yfm\/(?!Color\/(?:const|ColorSpecs\/const)\.js$)/,
    ],
};

test('should isolate built toolbar presets by mode', async (t) => {
    t.after(() => {
        fs.rmSync(localBuild, {force: true, recursive: true});
    });

    for (const mode of ['wysiwyg', 'markup']) {
        const filename = `${mode}-toolbars.mjs`;
        const {metafile} = await bundle(
            `import {${mode}ToolbarsPresets} from '@gravity-ui/markdown-editor/toolbars'; export default ${mode}ToolbarsPresets;`,
            filename,
            {
                minify: true,
                treeShaking: true,
                metafile: true,
                define: {'process.env.NODE_ENV': '"production"'},
            },
        );
        assertModeIsolation(mode, metafile);
        const {default: presets} = await import(path.join(localBuild, filename));
        assert.equal(typeof presets.full.items.bold[mode].exec, 'function');
    }

    const stylesheet = fs.readFileSync(path.join(localBuild, 'wysiwyg-toolbars.css'), 'utf8');
    assert.ok(/--yfm-colorify-gray\s*:/.test(stylesheet), 'Toolbar color variables are missing');

    const filename = 'toolbars-cjs.mjs';
    await bundle(`module.exports = require('@gravity-ui/markdown-editor/toolbars');`, filename);
    const {default: toolbars} = await import(path.join(localBuild, filename));
    assert.equal(typeof toolbars.wysiwygToolbarsPresets.full.items.bold.wysiwyg.exec, 'function');
    assert.equal(typeof toolbars.markupToolbarsPresets.full.items.bold.markup.exec, 'function');
});

function bundle(contents, filename, options = {}) {
    return build({
        bundle: true,
        format: 'esm',
        platform: 'browser',
        alias: {fs: nodeModuleFallback, path: nodeModuleFallback},
        outfile: path.join(localBuild, filename),
        stdin: {
            contents,
            resolveDir: path.join(import.meta.dirname, '../..'),
        },
        ...options,
    });
}

function assertModeIsolation(mode, metafile) {
    const emitted = Object.entries(metafile.outputs)
        .filter(([file]) => file.endsWith('.mjs'))
        .flatMap(([, {inputs}]) =>
            Object.entries(inputs)
                .filter(([, {bytesInOutput}]) => bytesInOutput > 0)
                .map(([input]) => input),
        );
    assert.deepEqual(
        emitted.filter((input) =>
            forbiddenDependencies[mode].some((pattern) => pattern.test(input)),
        ),
        [],
        `${mode} toolbar presets include modules from the other mode`,
    );
}

import assert from 'node:assert/strict';
import path from 'node:path';
import {test} from 'node:test';

import {build} from 'esbuild';

const nodeModuleFallback = path.join(
    import.meta.dirname,
    '../esbuild-test/node-module-alias-fallback.js',
);
const consumers = {
    state: {
        contents: `
            import {TabFocusModeState} from '@gravity-ui/markdown-editor/core';
            export const state = new TabFocusModeState('focus');
        `,
        forbiddenDependencies: [
            /node_modules\/(?:@codemirror\/|codemirror\/)/,
            /prosemirror-/,
            /build\/esm\/bundle\//,
        ],
    },
    wysiwyg: {
        contents: `
            import {TabFocusModeState, WysiwygEditor} from '@gravity-ui/markdown-editor/core';
            import {createWysiwygTabFocusModeExtension} from '@gravity-ui/markdown-editor/extensions';
            export const state = new TabFocusModeState('focus');
            export const extension = createWysiwygTabFocusModeExtension(state);
            export {WysiwygEditor};
        `,
        forbiddenDependencies: [
            /node_modules\/(?:@codemirror\/|codemirror\/)/,
            /build\/esm\/markup\//,
            /build\/esm\/bundle\//,
        ],
    },
    markup: {
        contents: `
            import {TabFocusModeState, createMarkupTabFocusMode} from '@gravity-ui/markdown-editor';
            export const state = new TabFocusModeState('focus');
            const tabFocus = createMarkupTabFocusMode(state);
            export const extension = tabFocus.extension;
            export const initialize = tabFocus.initialize;
        `,
        forbiddenDependencies: [
            /prosemirror-/,
            /build\/esm\/core\/Editor\.js$/,
            /build\/esm\/extensions\//,
            /build\/esm\/bundle\//,
        ],
    },
};

for (const [mode, {contents, forbiddenDependencies}] of Object.entries(consumers)) {
    test(`should isolate ${mode} Tab focus mode dependencies`, async () => {
        const {metafile} = await build({
            bundle: true,
            format: 'esm',
            platform: 'browser',
            outfile: path.join(import.meta.dirname, 'build/tab-focus-mode', `${mode}.mjs`),
            write: false,
            stdin: {contents, resolveDir: path.join(import.meta.dirname, '../..')},
            minify: true,
            treeShaking: true,
            metafile: true,
            define: {'process.env.NODE_ENV': '"production"'},
            loader: {
                '.eot': 'dataurl',
                '.woff': 'dataurl',
                '.woff2': 'dataurl',
                '.ttf': 'dataurl',
            },
            alias: {fs: nodeModuleFallback, path: nodeModuleFallback, stream: nodeModuleFallback},
        });
        const emitted = Object.entries(metafile.outputs)
            .filter(([file]) => file.endsWith('.mjs'))
            .flatMap(([, {inputs}]) =>
                Object.entries(inputs)
                    .filter(([, {bytesInOutput}]) => bytesInOutput > 0)
                    .map(([input]) => input),
            );

        assert.ok(emitted.length > 0, 'The consumer bundle must include its Tab focus API');
        assert.deepEqual(
            emitted.filter((input) => forbiddenDependencies.some((pattern) => pattern.test(input))),
            [],
            `${mode} Tab focus mode includes dependencies from another editor mode`,
        );
    });
}

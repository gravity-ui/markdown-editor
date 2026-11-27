import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';

import {build} from 'esbuild';

const localBuild = path.join(import.meta.dirname, 'build/wysiwyg-editor');
const nodeModuleFallback = path.join(
    import.meta.dirname,
    '../esbuild-test/node-module-alias-fallback.js',
);
const foreignModules = [
    /build\/esm\/markup\//,
    /build\/esm\/bundle\/markup\//,
    /build\/esm\/bundle\/(?:Editor|useMarkdownEditor|MarkdownEditorView|MarkupEditorComponent|MarkupEditorView|SplitModeView)\.js$/,
    /build\/esm\/bundle\/config\/markup\.js$/,
    /build\/esm\/(?:modules\/toolbars|bundle\/toolbar)\/markup\//,
    /build\/esm\/extensions\/additional\/GPT\/MarkupGpt\//,
];

for (const preset of ['default', 'explicit']) {
    test(`should isolate the WYSIWYG consumer with ${preset} toolbar configuration`, async (t) => {
        const outfile = path.join(localBuild, `${preset}.mjs`);
        t.after(() => {
            fs.rmSync(outfile, {force: true});
            fs.rmSync(outfile.replace(/\.mjs$/, '.css'), {force: true});
        });
        const explicit = preset === 'explicit';
        const {metafile} = await bundle(
            `
                import {createElement} from 'react';
                import {
                    useMarkdownWysiwygEditor,
                    MarkdownWysiwygEditorView,
                    MarkdownWysiwygEditorProvider,
                    useMarkdownWysiwygEditorContext,
                } from '@gravity-ui/markdown-editor';
                ${explicit ? "import {wysiwygToolbarsPresets} from '@gravity-ui/markdown-editor/toolbars';" : ''}
                export function Editor() {
                    const editor = useMarkdownWysiwygEditor({initial: {markup: 'Hello'}});
                    return createElement(MarkdownWysiwygEditorView, {
                        editor,
                        stickyToolbar: true,
                        ${explicit ? 'toolbarsPreset: wysiwygToolbarsPresets.full,' : ''}
                    });
                }
                export {MarkdownWysiwygEditorProvider, useMarkdownWysiwygEditorContext};
            `,
            outfile,
            {minify: true, treeShaking: true, metafile: true},
        );
        const emitted = Object.entries(metafile.outputs)
            .filter(([file]) => file.endsWith('.mjs'))
            .flatMap(([, {inputs}]) =>
                Object.entries(inputs)
                    .filter(([, {bytesInOutput}]) => bytesInOutput > 0)
                    .map(([input]) => input),
            );
        assert.ok(
            emitted.some((file) => /build\/esm\/bundle\/wysiwyg\/WysiwygCore\.js$/.test(file)),
            'The fixture must include the working WYSIWYG core',
        );
        assert.deepEqual(
            emitted.filter((file) => foreignModules.some((pattern) => pattern.test(file))),
            [],
            'The WYSIWYG consumer includes markup-only implementation',
        );
        const api = await import(outfile);
        assert.equal(typeof api.Editor, 'function');
        assert.ok(api.MarkdownWysiwygEditorProvider);
        assert.equal(typeof api.useMarkdownWysiwygEditorContext, 'function');
    });
}

test('should expose the standalone API through CommonJS', async (t) => {
    const outfile = path.join(localBuild, 'commonjs.mjs');
    t.after(() => {
        fs.rmSync(outfile, {force: true});
        fs.rmSync(outfile.replace(/\.mjs$/, '.css'), {force: true});
    });
    await bundle(
        `
            const api = require('@gravity-ui/markdown-editor');
            const {createElement} = require('react');
            const {renderToString} = require('react-dom/server');
            function ContextValue() {
                const editor = api.useMarkdownWysiwygEditorContext();
                return createElement('span', null, editor.toolbarVisible ? 'visible' : 'hidden');
            }
            function Editor() {
                const editor = api.useMarkdownWysiwygEditor({initial: {toolbarVisible: false}});
                return createElement(api.MarkdownWysiwygEditorProvider, {value: editor}, createElement(ContextValue));
            }
            module.exports = {
                render: () => renderToString(createElement(Editor)),
                MarkdownWysiwygEditorView: api.MarkdownWysiwygEditorView,
            };
        `,
        outfile,
    );
    const {default: api} = await import(outfile);
    assert.ok(api.MarkdownWysiwygEditorView);
    assert.equal(api.render(), '<span>hidden</span>');
});

function bundle(contents, outfile, options = {}) {
    return build({
        bundle: true,
        format: 'esm',
        platform: 'browser',
        outfile,
        stdin: {contents, resolveDir: path.join(import.meta.dirname, '../..')},
        loader: {'.eot': 'dataurl', '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl'},
        alias: {fs: nodeModuleFallback, path: nodeModuleFallback, stream: nodeModuleFallback},
        define: {'process.env.NODE_ENV': '"production"'},
        ...options,
    });
}

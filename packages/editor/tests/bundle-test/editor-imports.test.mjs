import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';

import {build} from 'esbuild';

const localBuild = path.join(import.meta.dirname, 'build/editor-imports');
const nodeModuleFallback = path.join(
    import.meta.dirname,
    '../esbuild-test/node-module-alias-fallback.js',
);
const consumers = {
    esm: `
        export {
            MarkdownEditorProvider, MarkdownEditorView, MarkupCommands, MarkupHelpers,
            mBoldItemData, markupToolbarConfigs, useMarkdownEditor, useMarkdownEditorContext,
            wBoldItemData, wysiwygToolbarConfigs,
        } from '@gravity-ui/markdown-editor';
        export {MarkdownEditorProvider as directProvider} from '@gravity-ui/markdown-editor/_/bundle/context.js';
        export {useMarkdownEditor as directHook} from '@gravity-ui/markdown-editor/_/bundle/useMarkdownEditor.js';
    `,
    cjs: `
        const api = require('@gravity-ui/markdown-editor');
        const {MarkdownEditorProvider: directProvider} = require('@gravity-ui/markdown-editor/_/bundle/context.js');
        const {useMarkdownEditor: directHook} = require('@gravity-ui/markdown-editor/_/bundle/useMarkdownEditor.js');
        module.exports = {...api, directProvider, directHook};
    `,
};

test('should support ESM and CommonJS editor imports', async (t) => {
    t.after(() => {
        fs.rmSync(localBuild, {force: true, recursive: true});
    });

    for (const [format, contents] of Object.entries(consumers)) {
        const outfile = path.join(localBuild, `${format}.mjs`);
        await build({
            bundle: true,
            format: 'esm',
            platform: 'browser',
            outfile,
            stdin: {contents, resolveDir: path.join(import.meta.dirname, '../..')},
            loader: {
                '.eot': 'dataurl',
                '.woff': 'dataurl',
                '.woff2': 'dataurl',
                '.ttf': 'dataurl',
            },
            alias: {fs: nodeModuleFallback, path: nodeModuleFallback, stream: nodeModuleFallback},
        });

        const imported = await import(outfile);
        const api = format === 'esm' ? imported : imported.default;
        assert.equal(typeof api.useMarkdownEditor, 'function');
        assert.equal(typeof api.useMarkdownEditorContext, 'function');
        assert.ok(api.MarkdownEditorView);
        assert.ok(api.MarkdownEditorProvider);
        assert.ok(api.MarkupCommands);
        assert.ok(api.MarkupHelpers);
        assert.ok(api.mBoldItemData);
        assert.ok(api.wBoldItemData);
        assert.equal(api.useMarkdownEditor, api.directHook);
        assert.equal(api.MarkdownEditorProvider, api.directProvider);
        assert.equal(api.markupToolbarConfigs.mBoldItemData, api.mBoldItemData);
        assert.equal(api.wysiwygToolbarConfigs.wBoldItemData, api.wBoldItemData);
    }
});

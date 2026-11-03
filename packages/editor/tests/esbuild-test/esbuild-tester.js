#!usr/bin/node

/* global require, __dirname -- Globals defined by Nodejs */

// This is used only for esbuild compatability testing

const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');

const esbuild = require('esbuild');
const {sassPlugin} = require('esbuild-sass-plugin');

const paths = {
    esbuildToTest: path.join(__dirname, './esbuild-to-test.mjs'),
    tempTest: path.join(__dirname, './temp-test.mjs'),
    localBuild: path.join(__dirname, './build'),
    compiledEsBuildToTest: path.join(__dirname, './build/esbuild-to-test.mjs'),
    aliases: path.join(__dirname, './node-module-alias-fallback.js'),
};

const esbuildOptions = {
    bundle: true,
    format: 'esm',
    outdir: paths.localBuild,
    loader: {
        '.tsx': 'tsx',
        '.eot': 'dataurl',
        '.woff': 'dataurl',
        '.woff2': 'dataurl',
        '.ttf': 'dataurl',
    },
    outExtension: {
        '.js': '.mjs',
    },
    plugins: [sassPlugin()],
    platform: 'browser',
    alias: ['fs', 'path', 'stream'].reduce((acc, name) => ({...acc, [name]: paths.aliases}), {}),
};

esbuild
    .build({...esbuildOptions, entryPoints: [paths.esbuildToTest]})
    .then(async () => {
        const allExports = (await import(paths.compiledEsBuildToTest)).default;
        // Make a file that exports everything from src
        await fsPromises.writeFile(paths.tempTest, `import {${allExports}} from '../../src'`);
        await esbuild.build({...esbuildOptions, entryPoints: [paths.tempTest]});

        for (const [mode, subpath] of [
            ['wysiwyg', 'toolbars'],
            ['markup', 'toolbars'],
            ['wysiwyg', '_/modules/toolbars/wysiwyg/index.js'],
            ['markup', '_/modules/toolbars/markup/index.js'],
        ]) {
            const entry = subpath === 'toolbars' ? 'public' : 'direct';
            const outfile = path.join(paths.localBuild, `${mode}-${entry}-toolbars.mjs`);
            const {metafile} = await esbuild.build({
                ...esbuildOptions,
                outdir: undefined,
                outfile,
                stdin: {
                    contents: `import {${mode}ToolbarsPresets} from '@gravity-ui/markdown-editor/${subpath}'; export default ${mode}ToolbarsPresets;`,
                    resolveDir: path.join(__dirname, '../..'),
                },
                minify: true,
                treeShaking: true,
                metafile: true,
                define: {'process.env.NODE_ENV': '"production"'},
            });
            const emitted = Object.entries(metafile.outputs)
                .filter(([file]) => file.endsWith('.mjs'))
                .flatMap(([, {inputs}]) =>
                    Object.entries(inputs)
                        .filter(([, {bytesInOutput}]) => bytesInOutput > 0)
                        .map(([input]) => input),
                );
            const foreign = mode === 'wysiwyg' ? 'markup' : 'wysiwyg';
            const foreignConfig = new RegExp(
                `build/esm/(?:modules/toolbars/${foreign}/|bundle/toolbar/${foreign}/)`,
            );
            const foreignRuntime =
                mode === 'wysiwyg'
                    ? [
                          /node_modules\/(?:@codemirror\/|codemirror\/)/,
                          /build\/esm\/markup\//,
                          /build\/esm\/extensions\/additional\/GPT\/MarkupGpt\//,
                      ]
                    : [
                          /prosemirror-/,
                          /build\/esm\/core\/Editor\.js/,
                          /build\/esm\/extensions\/(?:base|behavior|markdown)\//,
                          /build\/esm\/extensions\/yfm\/(?!Color\/(?:(?:const|ColorSpecs\/const)\.js|colors\.css))/,
                      ];
            assert.deepEqual(
                emitted.filter((input) =>
                    [foreignConfig, ...foreignRuntime].some((pattern) => pattern.test(input)),
                ),
                [],
                `${mode} toolbar presets include modules from the other mode`,
            );
            const {default: presets} = await import(outfile);
            const stylesheet = Object.keys(metafile.outputs)
                .filter((file) => file.endsWith('.css'))
                .map((file) => fs.readFileSync(file, 'utf8'))
                .join('\n');
            assert.ok(
                /--yfm-colorify-gray\s*:/.test(stylesheet),
                `${mode} toolbar color variables are missing`,
            );
            assert.deepEqual(Object.keys(presets), [
                'zero',
                'commonmark',
                'default',
                'yfm',
                'full',
            ]);
            assert.equal(typeof presets.full.items.bold[mode].exec, 'function');
        }

        const outfile = path.join(paths.localBuild, 'toolbars-cjs.mjs');
        await esbuild.build({
            ...esbuildOptions,
            outdir: undefined,
            outfile,
            stdin: {
                contents: `module.exports = require('@gravity-ui/markdown-editor/toolbars');`,
                resolveDir: path.join(__dirname, '../..'),
            },
        });
        const {default: toolbars} = await import(outfile);
        assert.equal(
            toolbars.full.items.bold.wysiwyg,
            toolbars.wysiwygToolbarsPresets.full.items.bold.wysiwyg,
        );
        assert.equal(
            toolbars.full.items.bold.markup,
            toolbars.markupToolbarsPresets.full.items.bold.markup,
        );
    })
    .finally(() => {
        // Cleanup
        if (fs.existsSync(paths.localBuild))
            fs.rmSync(paths.localBuild, {
                force: true,
                recursive: true,
            });
        if (fs.existsSync(paths.tempTest)) fs.rmSync(paths.tempTest);
    });

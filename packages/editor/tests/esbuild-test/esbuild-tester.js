#!usr/bin/node

/* global require, __dirname -- Globals defined by Nodejs */

// This is used only for esbuild compatability testing

const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

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

run().finally(() => {
    // Cleanup
    if (fs.existsSync(paths.localBuild))
        fs.rmSync(paths.localBuild, {
            force: true,
            recursive: true,
        });
    if (fs.existsSync(paths.tempTest)) fs.rmSync(paths.tempTest);
});

async function run() {
    const OriginalCSSStyleSheet = globalThis.CSSStyleSheet;
    const TestCSSStyleSheet = class CSSStyleSheet {
        replaceSync(value) {
            this.cssText = value;
        }
    };

    try {
        globalThis.CSSStyleSheet = TestCSSStyleSheet;

        const shadowStylesCjs = require(path.join(__dirname, '../../build/shadow-styles.cjs'));

        if (typeof shadowStylesCjs.cssText !== 'string' || shadowStylesCjs.cssText.length === 0) {
            throw new Error('shadow-styles CJS export is invalid: expected non-empty cssText');
        }

        if (typeof shadowStylesCjs.createStyleSheet !== 'function') {
            throw new Error('shadow-styles CJS export is invalid: expected createStyleSheet()');
        }

        const shadowStylesMjs = await import(
            pathToFileURL(path.join(__dirname, '../../build/shadow-styles.mjs')).href
        );

        if (shadowStylesMjs.cssText !== shadowStylesCjs.cssText) {
            throw new Error(
                'shadow-styles ESM export is invalid: expected the same cssText as CJS',
            );
        }

        if (typeof shadowStylesMjs.createStyleSheet !== 'function') {
            throw new Error('shadow-styles ESM export is invalid: expected createStyleSheet()');
        }

        const cjsStyleSheet = shadowStylesCjs.createStyleSheet();
        const mjsStyleSheet = shadowStylesMjs.createStyleSheet();

        if (
            !(cjsStyleSheet instanceof TestCSSStyleSheet) ||
            cjsStyleSheet.cssText !== shadowStylesCjs.cssText
        ) {
            throw new Error(
                'shadow-styles CJS helper is invalid: expected populated CSSStyleSheet',
            );
        }

        if (
            !(mjsStyleSheet instanceof TestCSSStyleSheet) ||
            mjsStyleSheet.cssText !== shadowStylesMjs.cssText
        ) {
            throw new Error(
                'shadow-styles ESM helper is invalid: expected populated CSSStyleSheet',
            );
        }

        console.info('shadow-styles smoke test: OK (length:', shadowStylesCjs.cssText.length, ')');

        await esbuild.build({...esbuildOptions, entryPoints: [paths.esbuildToTest]});

        const allExports = (await import(paths.compiledEsBuildToTest)).default;

        // Make a file that exports everything from src
        await fsPromises.writeFile(paths.tempTest, `import {${allExports}} from '../../src'`);
        await esbuild.build({...esbuildOptions, entryPoints: [paths.tempTest]});
    } finally {
        if (typeof OriginalCSSStyleSheet === 'undefined') {
            delete globalThis.CSSStyleSheet;
        } else {
            globalThis.CSSStyleSheet = OriginalCSSStyleSheet;
        }
    }
}

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
    const stylesStringCjs = require(path.join(__dirname, '../../build/styles-string.cjs'));

    if (typeof stylesStringCjs !== 'string' || stylesStringCjs.length === 0) {
        throw new Error('styles-string CJS export is invalid: expected non-empty string');
    }

    const {default: stylesStringMjs} = await import(
        pathToFileURL(path.join(__dirname, '../../build/styles-string.mjs')).href
    );

    if (stylesStringMjs !== stylesStringCjs) {
        throw new Error('styles-string ESM export is invalid: expected the same CSS as CJS');
    }

    console.info('styles-string smoke test: OK (length:', stylesStringCjs.length, ')');

    await esbuild.build({...esbuildOptions, entryPoints: [paths.esbuildToTest]});

    const allExports = (await import(paths.compiledEsBuildToTest)).default;

    // Make a file that exports everything from src
    await fsPromises.writeFile(paths.tempTest, `import {${allExports}} from '../../src'`);
    await esbuild.build({...esbuildOptions, entryPoints: [paths.tempTest]});
}

#!usr/bin/node

/* global require, __dirname -- Globals defined by Nodejs */

// This is used only for esbuild compatability testing

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

// Smoke test: verify styles-string export before esbuild bundling test
const stylesStringCjs = require(path.join(__dirname, '../../build/styles-string.cjs'));
if (typeof stylesStringCjs !== 'string' || stylesStringCjs.length === 0) {
    throw new Error('styles-string CJS export is invalid: expected non-empty string');
}
const stylesStringMjs = fs.readFileSync(
    path.join(__dirname, '../../build/styles-string.mjs'),
    'utf8',
);
if (!stylesStringMjs.startsWith('export default `')) {
    throw new Error('styles-string ESM file is invalid: expected "export default `..."');
}
console.log('styles-string smoke test: OK (length:', stylesStringCjs.length, ')');

esbuild
    .build({...esbuildOptions, entryPoints: [paths.esbuildToTest]})
    .then(async () => {
        const allExports = (await import(paths.compiledEsBuildToTest)).default;
        // Make a file that exports everything from src
        await fsPromises.writeFile(paths.tempTest, `import {${allExports}} from '../../src'`);
        await esbuild.build({...esbuildOptions, entryPoints: [paths.tempTest]});
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

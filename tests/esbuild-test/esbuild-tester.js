#!usr/bin/node

/* eslint-env node */

// This is used only for esbuild compatability testing

const esbuild = require('esbuild');
const fs = require('fs');
const fsPrmosises = require('fs/promises');
const path = require('path');
const {sassPlugin} = require('esbuild-sass-plugin');

const paths = {
    esbuildToTest: path.join(__dirname, './esbuild-to-test.mjs'),
    tempTest: path.join(__dirname, './temp-test.mjs'),
    localBuild: path.join(__dirname, './build'),
    compiledEsBuildToTest: path.join(__dirname, './build/esbuild-to-test.mjs'),
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
};

esbuild
    .build({...esbuildOptions, entryPoints: [paths.esbuildToTest]})
    .then(async () => {
        const allExports = (await import(paths.compiledEsBuildToTest)).default;
        // Make a file that exports everything from src
        await fsPrmosises.writeFile(paths.tempTest, `import {${allExports}} from '../../src'`);
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

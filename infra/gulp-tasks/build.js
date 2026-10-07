import path from 'node:path';

import * as utils from '@gravity-ui/gulp-utils';
import gulp from 'gulp';
import concat from 'gulp-concat';
import replace from 'gulp-replace';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import {rimraf} from 'rimraf';
import * as jsSass from 'sass';

const sass = gulpSass(jsSass);

const EXCLUDE_TEST_DIRECTORIES = '!src/**/__tests__/**';

const Module = Object.freeze({
    CJS: 'nodenext',
    ESM: 'esnext',
});

/**
 * Registers build tasks for the project using Gulp.
 * @param {object} config Configuration object
 * @param {string} config.version Version string to embed in the build
 * @param {string} config.buildDir Root build output directory
 * @param {string} config.nodeModulesDir Path to node_modules directory
 * @param {string[]} [config.esmSideEffects] `sideEffects` patterns, relative to `build/esm`, written into
 * `build/esm/package.json`. That file shadows the package's root `package.json` for every module under
 * `build/esm`, so bundlers never see the root `sideEffects` field.
 */
export function registerBuildTasks({version, buildDir, nodeModulesDir, esmSideEffects}) {
    const BUILD_DIR = buildDir;
    const BUILD_DIR_CJS = path.resolve(BUILD_DIR, 'cjs');
    const BUILD_DIR_ESM = path.resolve(BUILD_DIR, 'esm');
    const NODE_MODULES_DIR = nodeModulesDir;

    gulp.task('clean', () => rimraf(BUILD_DIR));

    gulp.task('ts-cjs', () => compileTS({module: Module.CJS, destPath: BUILD_DIR_CJS}));
    gulp.task('ts-esm', () => compileTS({module: Module.ESM, destPath: BUILD_DIR_ESM}));
    gulp.task('ts', gulp.parallel('ts-cjs', 'ts-esm'));

    gulp.task('json', () => {
        return gulp
            .src(['src/**/*.json', EXCLUDE_TEST_DIRECTORIES])
            .pipe(gulp.dest(BUILD_DIR_CJS))
            .pipe(gulp.dest(BUILD_DIR_ESM));
    });

    gulp.task('scss', () => {
        return gulp
            .src(['src/**/*.scss', EXCLUDE_TEST_DIRECTORIES])
            .pipe(
                replace(/@(import|use) '~.+'/g, (match) =>
                    match.replace('~', NODE_MODULES_DIR + '/'),
                ),
            )
            .pipe(sass({loadPaths: [NODE_MODULES_DIR]}))
            .pipe(gulp.dest(BUILD_DIR_CJS))
            .pipe(gulp.dest(BUILD_DIR_ESM))
            .pipe(concat('styles.css')) // also bundle all css to single file
            .pipe(gulp.dest(BUILD_DIR));
    });

    gulp.task('build', gulp.parallel('ts', 'json', 'scss'));

    /**
     * Compiles TypeScript files to the specified destination.
     * @param {object} config Configuration object
     * @param {'nodenext'|'esnext'} config.module Module format ('nodenext' for CJS or 'esnext' for ESM)
     * @param {string} config.destPath Destination directory for compiled files
     * @returns {Promise<void>}
     */
    async function compileTS({module, destPath}) {
        const tsProject = await utils.createTypescriptProject({
            compilerOptions: {
                module,
                declaration: true,
                ...(module === Module.ESM
                    ? undefined
                    : {
                          moduleResolution: 'nodenext',
                          verbatimModuleSyntax: false,
                      }),
            },
        });
        const transformers = [
            tsProject.customTransformers.transformScssImports,
            tsProject.customTransformers.transformLocalModules,
        ];

        return new Promise((resolve) => {
            gulp.src([
                'src/**/*.{js,jsx,ts,tsx}',
                '!src/**/*.test.{js,jsx,ts,tsx}',
                EXCLUDE_TEST_DIRECTORIES,
            ])
                .pipe(sourcemaps.init())
                .pipe(
                    tsProject({
                        customTransformers: {
                            before: transformers,
                            afterDeclarations: transformers,
                        },
                    }),
                )
                .pipe(sourcemaps.write('.', {includeContent: true, sourceRoot: '../../src'}))
                .pipe(
                    utils.addVirtualFile({
                        fileName: 'package.json',
                        text: JSON.stringify(
                            module === Module.ESM
                                ? {type: 'module', sideEffects: esmSideEffects}
                                : {type: 'commonjs'},
                        ),
                    }),
                )
                .pipe(replace('__VERSION__', `'${version}'`))
                .pipe(gulp.dest(destPath))
                .on('end', resolve);
        });
    }
}

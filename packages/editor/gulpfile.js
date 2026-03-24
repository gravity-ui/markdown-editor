/* global require, __dirname -- Globals defined by Nodejs */

const fs = require('node:fs');
const path = require('node:path');

const utils = require('@gravity-ui/gulp-utils');
const gulp = require('gulp');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const rimraf = require('rimraf');

const pkg = require('./package.json');

const Module = Object.freeze({
    CJS: 'nodenext',
    ESM: 'esnext',
});

const BUILD_DIR = path.resolve('build');
const BUILD_DIR_CJS = path.resolve(BUILD_DIR, 'cjs');
const BUILD_DIR_ESM = path.resolve(BUILD_DIR, 'esm');

const NODE_MODULES_DIR = path.resolve(__dirname, 'node_modules');

gulp.task('clean', (done) => rimraf(BUILD_DIR, done));

gulp.task('ts-cjs', () => compileTS({module: Module.CJS, destPath: BUILD_DIR_CJS}));
gulp.task('ts-esm', () => compileTS({module: Module.ESM, destPath: BUILD_DIR_ESM}));
gulp.task('ts', gulp.parallel('ts-cjs', 'ts-esm'));

gulp.task('json', () => {
    return gulp.src('src/**/*.json').pipe(gulp.dest(BUILD_DIR_CJS)).pipe(gulp.dest(BUILD_DIR_ESM));
});

gulp.task('scss', () => {
    return gulp
        .src('src/**/*.scss')
        .pipe(
            replace(/@(import|use) '~.+'/g, (match) => match.replace('~', NODE_MODULES_DIR + '/')),
        )
        .pipe(sass({loadPaths: [NODE_MODULES_DIR]}))
        .pipe(gulp.dest(BUILD_DIR_CJS))
        .pipe(gulp.dest(BUILD_DIR_ESM))
        .pipe(concat('styles.css')) // also bundle all css to single file
        .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('styles-string', (done) => {
    const css = fs.readFileSync(path.join(BUILD_DIR, 'styles.css'), 'utf8');
    const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const content = `\`${escaped}\``;

    fs.writeFileSync(path.join(BUILD_DIR, 'styles-string.js'), `export default ${content};\n`);
    fs.writeFileSync(path.join(BUILD_DIR, 'styles-string.cjs'), `module.exports = ${content};\n`);
    fs.writeFileSync(
        path.join(BUILD_DIR, 'styles-string.d.ts'),
        `declare const styles: string;\nexport default styles;\n`,
    );
    done();
});

gulp.task('build', gulp.series(gulp.parallel('ts', 'json', 'scss'), 'styles-string'));

gulp.task('default', gulp.series('clean', 'build'));

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
        gulp.src(['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.test.{js,jsx,ts,tsx}'])
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
                    text: JSON.stringify({type: module === Module.ESM ? 'module' : 'commonjs'}),
                }),
            )
            .pipe(replace('__VERSION__', `'${pkg.version}'`))
            .pipe(gulp.dest(destPath))
            .on('end', resolve);
    });
}

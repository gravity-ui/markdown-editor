/* eslint-env node */

const path = require('path');
const gulp = require('gulp');
const rimraf = require('rimraf');
const ts = require('gulp-typescript');
const replace = require('gulp-replace');
const concat = require('gulp-concat');
const sass = require('gulp-sass')(require('sass'));
const pkg = require('./package.json');

const Module = Object.freeze({
    CJS: 'commonjs',
    ESM: 'esnext',
});

const BUILD_DIR = path.resolve('build');
const BUILD_DIR_CJS = path.resolve(BUILD_DIR, 'cjs');
const BUILD_DIR_ESM = path.resolve(BUILD_DIR, 'esm');

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
        .pipe(replace(/@(import|use) '~.+';/g, (match) => match.replace('~', 'node_modules/')))
        .pipe(sass())
        .pipe(gulp.dest(BUILD_DIR_CJS))
        .pipe(gulp.dest(BUILD_DIR_ESM))
        .pipe(concat('styles.css')) // also bundle all css to single file
        .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('build', gulp.parallel('ts', 'json', 'scss'));

gulp.task('default', gulp.series('clean', 'build'));

function compileTS({module, destPath}) {
    const tsProject = ts.createProject('tsconfig.json', {
        module,
        declaration: true,
        isolatedModules: false, // включение данной опции вырубает генерацию .d.ts файлов о_О
    });
    return gulp
        .src(['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.test.{js,jsx,ts,tsx}'])
        .pipe(
            replace(
                /import '.+\.scss';/g,
                module === Module.CJS ? '' : (match) => match.replace('.scss', '.css'),
            ),
        )
        .pipe(replace(/(\.\.\/)+assets\//g, (match) => '../' + match))
        .pipe(tsProject())
        .pipe(replace('__VERSION__', `'${pkg.version}'`))
        .pipe(gulp.dest(destPath));
}

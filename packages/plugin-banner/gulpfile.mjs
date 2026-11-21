import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {dest, parallel, series, src, task} from '@markdown-editor/gulp-tasks';
import {registerBuildTasks} from '@markdown-editor/gulp-tasks/build';

import pkg from './package.json' with {type: 'json'};

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILD_DIR = resolve('build');
const NODE_MODULES_DIR = resolve(__dirname, 'node_modules');

registerBuildTasks({
    version: pkg.version,
    buildDir: BUILD_DIR,
    nodeModulesDir: NODE_MODULES_DIR,
    esmSideEffects: ['*.css'],
});

task('scss-partials', () => src('src/_layout.scss').pipe(dest(resolve(BUILD_DIR, 'styles'))));
task('build', parallel('ts', 'json', 'scss', 'scss-partials'));

task('default', series('clean', 'build'));

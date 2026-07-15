import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildDocs} from '@gravity-ui/gulp-utils';
import {series, task} from '@markdown-editor/gulp-tasks';
import {registerBuildTasks} from '@markdown-editor/gulp-tasks/build';

import pkg from './package.json' with {type: 'json'};

const __dirname = dirname(fileURLToPath(import.meta.url));

const BUILD_DIR = resolve('build');
const NODE_MODULES_DIR = resolve(__dirname, 'node_modules');

registerBuildTasks({
    version: pkg.version,
    buildDir: BUILD_DIR,
    nodeModulesDir: NODE_MODULES_DIR,
});

// Generates the AI-agent docs tree (INDEX.md + guides) into build/docs.
task('build-docs', (done) => {
    buildDocs({
        packageName: '@gravity-ui/markdown-editor',
        outDir: resolve(BUILD_DIR, 'docs'),
        sources: [
            {
                title: 'Guides',
                kind: 'markdown',
                baseDir: 'docs',
                outPrefix: 'guides',
                nameFromTitle: true,
            },
        ],
    });
    done();
});

task('default', series('clean', 'build', 'build-docs'));

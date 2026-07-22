import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {copyFileSync, rmSync} from 'node:fs';

import {buildDocs} from '@gravity-ui/readme-validator';
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
    // readme-validator's buildDocs reads the package overview from <rootDir>/README.md.
    // In the repo, the README lives at the monorepo root and is only copied here by
    // `prepack` — which runs AFTER `prepublishOnly` (and thus after this task) during
    // `pnpm publish`. Copy it ourselves first, otherwise INDEX.md ships without the
    // README sections (only the guides list) in the published tarball.
    const copiedReadme = resolve(__dirname, 'README.md');
    copyFileSync(resolve(__dirname, '../../README.md'), copiedReadme);

    buildDocs({
        packageName: '@gravity-ui/markdown-editor',
        outDir: resolve(BUILD_DIR, 'docs'),
        // rootDir is the published package root (this directory). buildDocs derives
        // the `node_modules/<pkg>/...` path in INDEX.md from path.relative(rootDir,
        // outDir), so it must be the package dir, not the monorepo root — otherwise
        // the shipped path gains a spurious `packages/editor/` segment.
        rootDir: __dirname,
        sources: [
            {
                title: 'Guides',
                kind: 'markdown',
                // Guides live in the monorepo-root docs/ folder; resolved relative
                // to the package dir (rootDir above).
                baseDir: '../../docs',
                outPrefix: 'guides',
                nameFromTitle: true,
            },
        ],
    });

    // Drop the scratch copy so it doesn't linger in the working tree. During
    // `pnpm publish`, `prepack` re-creates README.md before packing, so the
    // published tarball still ships it.
    rmSync(copiedReadme, {force: true});

    done();
});

task('default', series('clean', 'build', 'build-docs'));

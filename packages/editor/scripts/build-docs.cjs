// Generates the AI-agent docs tree for the published editor package.
//
// Sources: the monorepo-root `docs/` folder (how-tos/guides). The output is
// written into this package's `build/docs`, which ships in the npm tarball
// (`files: ["build", ...]`). Run via `pnpm run build:docs`; also chained into
// `prepack` so a freshly packed/published tarball always carries current docs.
const path = require('node:path');
const {buildDocs} = require('@gravity-ui/gulp-utils');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

buildDocs({
    rootDir: repoRoot,
    // rootDir is the monorepo root (its package.json is @markdown-editor/monorepo);
    // the docs ship inside the published editor package, so name INDEX after it.
    packageName: '@gravity-ui/markdown-editor',
    outDir: path.resolve(__dirname, '..', 'build', 'docs'),
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

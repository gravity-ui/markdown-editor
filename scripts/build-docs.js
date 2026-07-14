// Generates the AI-agent docs tree for the publishable editor package and writes
// it into packages/editor/build/docs (shipped via the editor package's `files`).
// The guides live at the monorepo root under docs/, hence rootDir = repo root.
// Run via `npm run build:docs`.
const path = require('node:path');
const {buildDocs} = require('@gravity-ui/gulp-utils');

buildDocs({
    rootDir: process.cwd(),
    outDir: path.resolve('packages/editor/build/docs'),
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

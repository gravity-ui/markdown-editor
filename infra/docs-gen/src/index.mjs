#!/usr/bin/env node

import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {Generator} from './generator.mjs';

const DOCS_DIR = 'docs';
const DOCS_SRC_DIR = 'docs-src';

// `pnpm --filter` runs this script from infra/docs-gen, while docs/ and
// docs-src/ live at the repository root.
function findRepoRoot(startDir = dirname(fileURLToPath(import.meta.url))) {
    let dir = startDir;

    while (dir !== dirname(dir)) {
        if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
            return dir;
        }

        dir = dirname(dir);
    }

    throw new Error('Could not locate monorepo root');
}

function main() {
    const rootDir = findRepoRoot();
    const docsDir = join(rootDir, DOCS_DIR);
    const docsSrcDir = join(rootDir, DOCS_SRC_DIR);

    new Generator(docsDir, docsSrcDir).run();
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}

#!/usr/bin/env node
import {isAbsolute, join} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {DOCS_GEN_DIR, EDITOR_PKG_DIR, REPO_ROOT} from './config.mjs';
import {ExtensionExtractor} from './extractor/index.mjs';
import {logger} from './logger.mjs';

/**
 * Resolves a path from the repository root.
 */
function resolveFromRoot(path) {
    return isAbsolute(path) ? path : join(REPO_ROOT, path);
}

/**
 * Parses CLI options for extension data extraction.
 */
export function parseArgs(args = process.argv.slice(2)) {
    const opts = {
        editorPkg: EDITOR_PKG_DIR,
        outDir: DOCS_GEN_DIR,
        only: null,
    };

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        switch (arg) {
            case '--':
                break;
            case '--editor-pkg':
                opts.editorPkg = resolveFromRoot(args[++index]);
                break;
            case '--out-dir':
                opts.outDir = resolveFromRoot(args[++index]);
                break;
            case '--only':
                opts.only = args[++index]
                    ?.split(',')
                    .map((value) => value.trim())
                    .filter(Boolean);
                break;
            case '--help':
                opts.help = true;
                break;
            default:
                throw new Error(`Unknown option: ${arg}`);
        }
    }

    return opts;
}

/**
 * Prints command usage information.
 */
function printHelp() {
    logger.info('Usage: pnpm --filter @markdown-editor/docs-gen run extract [options]');
    logger.info('');
    logger.info('Options:');
    logger.info('  --only Bold,Link       Extract selected extension names');
    logger.info('  --out-dir tmp/docs-gen Override output directory');
    logger.info('  --editor-pkg path      Override packages/editor path');
}

/**
 * Runs extension data extraction from CLI arguments.
 */
export function main(args = process.argv.slice(2)) {
    const opts = parseArgs(args);
    if (opts.help) {
        printHelp();
        return;
    }

    new ExtensionExtractor({
        editorPkg: opts.editorPkg,
        outDir: opts.outDir,
        repoRoot: REPO_ROOT,
    }).run({only: opts.only});
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    try {
        main();
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
}

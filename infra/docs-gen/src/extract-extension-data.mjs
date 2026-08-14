#!/usr/bin/env node
/**
 * English: CLI entry point for raw extension metadata extraction.
 *
 * Русский: CLI-точка входа для извлечения сырых метаданных расширений.
 */
import {isAbsolute, join} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

import {DOCS_GEN_DIR, EDITOR_PKG_DIR, REPO_ROOT, createExtensionEntryPoints} from './config.mjs';
import {ExtensionExtractor} from './extractor/index.mjs';
import {logger} from './logger.mjs';

/**
 * Resolves a path from the repository root.
 */
function resolveFromRoot(path) {
    return isAbsolute(path) ? path : join(REPO_ROOT, path);
}

/**
 * Creates default CLI options.
 */
function createDefaultOptions() {
    return {
        editorPkg: EDITOR_PKG_DIR,
        outDir: DOCS_GEN_DIR,
        only: null,
    };
}

/**
 * Reads a required option value.
 */
function readOptionValue(args, index, optionName) {
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${optionName}`);
    }

    return value;
}

/**
 * Parses comma-separated extension names.
 */
function parseOnlyOption(value) {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

/**
 * Applies one CLI option to a new options object.
 */
function applyOption(opts, args, index) {
    const arg = args[index];

    switch (arg) {
        case '--editor-pkg':
            return {
                nextIndex: index + 1,
                opts: {...opts, editorPkg: resolveFromRoot(readOptionValue(args, index, arg))},
            };
        case '--out-dir':
            return {
                nextIndex: index + 1,
                opts: {...opts, outDir: resolveFromRoot(readOptionValue(args, index, arg))},
            };
        case '--only':
            return {
                nextIndex: index + 1,
                opts: {...opts, only: parseOnlyOption(readOptionValue(args, index, arg))},
            };
        case '--help':
            return {nextIndex: index, opts: {...opts, help: true}};
        default:
            throw new Error(`Unknown option: ${arg}`);
    }
}

/**
 * Parses CLI options for extension data extraction.
 */
export function parseArgs(args = process.argv.slice(2)) {
    let opts = createDefaultOptions();

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === '--') return opts;

        const parsedOption = applyOption(opts, args, index);
        opts = parsedOption.opts;
        index = parsedOption.nextIndex;
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
    logger.info('  --editor-pkg path      Override configured editor package path');
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
        entryPoints: createExtensionEntryPoints({editorPkg: opts.editorPkg}),
        outDir: opts.outDir,
        repoRoot: REPO_ROOT,
        versionPackageDir: opts.editorPkg,
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

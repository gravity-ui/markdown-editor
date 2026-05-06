import {existsSync, rmSync} from 'node:fs';
import process from 'node:process';

import {Assembler} from './assembler.mjs';
import {Enricher} from './enricher.mjs';
import {ExtensionExtractor} from './extractor/index.mjs';
import {Generator} from './generator.mjs';
import {logger} from './logger.mjs';

const EDITOR_PKG = 'packages/editor';
const DOCS_DIR = 'docs';
const DOCS_SRC_DIR = 'docs-src';
const DOCS_GEN_DIR = 'docs-gen';

/**
 * Parses CLI arguments into a command and options object
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const opts = {mode: 'prompts', only: null, model: null};

    for (let i = 1; i < args.length; i++) {
        switch (args[i]) {
            case '--mode':
                opts.mode = args[++i];
                break;
            case '--only':
                opts.only = args[++i]?.split(',');
                break;
            case '--model':
                opts.model = args[++i];
                break;
        }
    }

    return {command, opts};
}

function runGenerate() {
    new Generator(DOCS_DIR, DOCS_SRC_DIR).run();
}

function runExtract() {
    new ExtensionExtractor(EDITOR_PKG, DOCS_GEN_DIR).run();
}

async function runEnrich(opts) {
    const enricher = new Enricher(DOCS_GEN_DIR);
    enricher.load();

    switch (opts.mode) {
        case 'prompts': {
            const count = enricher.generatePrompts(opts);
            logger.success(`Generated ${count} prompt files in ${DOCS_GEN_DIR}/prompts/`);
            logger.info('\nNext steps:');
            logger.info('  - Process prompts through your AI tool');
            logger.info(`  - Save responses in ${DOCS_GEN_DIR}/responses/ExtName.json`);
            logger.info('  - Run: node scripts/docs/index.mjs enrich --mode apply');
            logger.info('\nOr with OpenAI API:');
            logger.info('  OPENAI_API_KEY=sk-... node scripts/docs/index.mjs enrich --mode enrich');
            break;
        }
        case 'enrich': {
            const count = await enricher.enrichWithAI(opts);
            logger.success(`Enriched ${count} docs in ${DOCS_GEN_DIR}/enriched/`);
            break;
        }
        case 'apply': {
            const count = enricher.applyResponses();
            logger.success(`Applied responses to ${count} docs in ${DOCS_GEN_DIR}/enriched/`);
            break;
        }
        default:
            logger.error(`Unknown enrich mode: ${opts.mode}. Use --mode prompts|enrich|apply`);
            process.exit(1);
    }
}

function runAssemble() {
    new Assembler(DOCS_GEN_DIR, DOCS_SRC_DIR).run();
}

function clearEnrichedDocs() {
    const enrichedDir = `${DOCS_GEN_DIR}/enriched`;

    if (existsSync(enrichedDir)) {
        logger.info(`Removing stale enriched docs from ${enrichedDir}/`);
        rmSync(enrichedDir, {recursive: true, force: true});
    }
}

/**
 * Full pipeline: generate -> extract -> assemble
 */
function runBuild() {
    clearEnrichedDocs();
    runGenerate();
    runExtract();
    runAssemble();
}

async function main() {
    const {command, opts} = parseArgs();

    const commands = {
        generate: runGenerate,
        extract: runExtract,
        enrich: () => runEnrich(opts),
        assemble: runAssemble,
        build: runBuild,
    };

    const handler = commands[command];
    if (!handler) {
        logger.error(`Unknown command: ${command}`);
        logger.info('Available commands: generate, extract, enrich, assemble, build');
        process.exit(1);
    }

    await handler();
}

main().catch((err) => {
    logger.error(err);
    process.exit(1);
});

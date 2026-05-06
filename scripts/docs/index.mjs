import process from 'node:process';
import {fileURLToPath} from 'node:url';

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
 * @param args
 */
export function parseArgs(args = process.argv.slice(2)) {
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

export function createCommandHandlers(paths = {}) {
    const editorPkg = paths.editorPkg || EDITOR_PKG;
    const docsDir = paths.docsDir || DOCS_DIR;
    const docsSrcDir = paths.docsSrcDir || DOCS_SRC_DIR;
    const docsGenDir = paths.docsGenDir || DOCS_GEN_DIR;

    function runGenerate() {
        new Generator(docsDir, docsSrcDir).run();
    }

    function runExtract() {
        new ExtensionExtractor(editorPkg, docsGenDir).run();
    }

    async function runEnrich(opts) {
        const enricher = new Enricher(docsGenDir);
        enricher.load();

        switch (opts.mode) {
            case 'prompts': {
                const count = enricher.generatePrompts(opts);
                logger.success(`Generated ${count} prompt files in ${docsGenDir}/prompts/`);
                logger.info('\nNext steps:');
                logger.info('  - Process prompts through your AI tool');
                logger.info(`  - Save responses in ${docsGenDir}/responses/ExtName.json`);
                logger.info('  - Run: node scripts/docs/index.mjs enrich --mode apply');
                logger.info('\nOr with OpenAI API:');
                logger.info(
                    '  OPENAI_API_KEY=sk-... node scripts/docs/index.mjs enrich --mode enrich',
                );
                break;
            }
            case 'enrich': {
                const count = await enricher.enrichWithAI(opts);
                logger.success(`Enriched ${count} docs in ${docsGenDir}/enriched/`);
                break;
            }
            case 'apply': {
                const count = enricher.applyResponses();
                logger.success(`Applied responses to ${count} docs in ${docsGenDir}/enriched/`);
                break;
            }
            default:
                throw new Error(
                    `Unknown enrich mode: ${opts.mode}. Use --mode prompts|enrich|apply`,
                );
        }
    }

    function runAssemble() {
        new Assembler(docsGenDir, docsSrcDir).run();
    }

    function runBuild() {
        runGenerate();
        runExtract();
        runAssemble();
    }

    return {
        generate: runGenerate,
        extract: runExtract,
        enrich: runEnrich,
        assemble: runAssemble,
        build: runBuild,
    };
}

export async function main(args = process.argv.slice(2), paths = {}) {
    const {command, opts} = parseArgs(args);
    const commands = createCommandHandlers(paths);

    const handler = commands[command];
    if (!handler) {
        logger.info('Available commands: generate, extract, enrich, assemble, build');
        throw new Error(`Unknown command: ${command}`);
    }

    if (command === 'enrich') {
        await handler(opts);
        return;
    }

    await handler();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main().catch((err) => {
        logger.error(err);
        process.exit(1);
    });
}

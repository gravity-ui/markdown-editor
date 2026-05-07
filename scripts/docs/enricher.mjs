import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';

import {config, isInternalExtension} from './config.mjs';
import {logger} from './logger.mjs';

const AI_MARKER_RE = /<!-- AI:NEEDED:(\w+) -->/g;

function readExtensionsIR(irPath) {
    const parsed = JSON.parse(readFileSync(irPath, 'utf-8'));
    if (Array.isArray(parsed)) return {version: 'unknown', extensions: parsed};
    return parsed;
}

/**
 * Enriches raw extension docs with AI-generated content
 */
export class Enricher {
    constructor(docsGenDir) {
        this.docsGenDir = docsGenDir;
        this.rawDir = join(docsGenDir, 'raw');
        this.enrichedDir = join(docsGenDir, 'enriched');
        this.promptsDir = join(docsGenDir, 'prompts');
        this.irPath = join(docsGenDir, 'extensions.json');
    }

    /**
     * Loads extensions IR and raw doc file list
     */
    load() {
        if (!existsSync(this.rawDir)) {
            const message = `${this.rawDir} not found. Run extract first.`;
            logger.error(message);
            throw new Error(message);
        }
        if (!existsSync(this.irPath)) {
            const message = `${this.irPath} not found. Run extract first.`;
            logger.error(message);
            throw new Error(message);
        }

        const ir = readExtensionsIR(this.irPath);
        this.version = ir.version;
        this.extensions = ir.extensions;
        this.rawFiles = readdirSync(this.rawDir).filter((f) => f.endsWith('.md'));
        logger.info(`Found ${this.rawFiles.length} raw docs, ${this.extensions.length} extensions`);
    }

    /**
     * Generates prompt JSON files for manual AI processing
     */
    generatePrompts(opts) {
        mkdirSync(this.promptsDir, {recursive: true});

        let count = 0;
        for (const file of this.rawFiles) {
            const extName = basename(file, '.md');
            if (opts.only && !opts.only.includes(extName)) continue;
            if (isInternalExtension(extName)) continue;

            const rawContent = readFileSync(join(this.rawDir, file), 'utf-8');
            const extInfo = this.extensions.find((e) => e.name === extName);
            if (!extInfo) continue;

            const markers = [...rawContent.matchAll(AI_MARKER_RE)].map((m) => m[1]);
            if (markers.length === 0) continue;

            const sourceCode = this.readExtensionSource(extInfo);
            const prompts = {};
            for (const section of markers) {
                prompts[section] = this.buildPrompt(
                    section,
                    extName,
                    rawContent,
                    sourceCode,
                    extInfo,
                );
            }

            writeFileSync(
                join(this.promptsDir, `${extName}.json`),
                JSON.stringify({extension: extName, prompts}, null, 2),
            );
            count++;
        }

        return count;
    }

    /**
     * Applies manually prepared AI responses from docs-gen/responses/ directory
     */
    applyResponses() {
        mkdirSync(this.enrichedDir, {recursive: true});
        const responsesDir = join(this.docsGenDir, 'responses');

        if (!existsSync(responsesDir)) {
            logger.info(`No responses directory found at ${responsesDir}`);
            logger.info('To use manual enrichment:');
            logger.info('  1. Run: pnpm docs:enrich:prompts');
            logger.info(`  2. Process prompts from ${this.promptsDir}/`);
            logger.info(`  3. Save responses in ${responsesDir}/ExtName.json`);
            logger.info('  4. Run: pnpm docs:enrich:apply');
            return 0;
        }

        let count = 0;
        for (const file of this.rawFiles) {
            const extName = basename(file, '.md');
            if (isInternalExtension(extName)) continue;
            const responsePath = join(responsesDir, `${extName}.json`);
            if (!existsSync(responsePath)) continue;

            const rawContent = readFileSync(join(this.rawDir, file), 'utf-8');
            const responses = JSON.parse(readFileSync(responsePath, 'utf-8'));

            let enrichedContent = rawContent;
            for (const [section, text] of Object.entries(responses)) {
                enrichedContent = enrichedContent.replace(`<!-- AI:NEEDED:${section} -->`, text);
            }

            writeFileSync(join(this.enrichedDir, `${extName}.md`), enrichedContent);
            count++;
        }

        return count;
    }

    /**
     * Reads relevant source files from an extension directory for AI context
     */
    readExtensionSource(extInfo) {
        const dir = extInfo.dirPath;
        if (!existsSync(dir)) return '';

        const files = [];
        const walk = (d) => {
            for (const entry of readdirSync(d, {withFileTypes: true})) {
                const full = join(d, entry.name);
                if (entry.isDirectory()) {
                    if (!entry.name.includes('NodeView') && entry.name !== 'node_modules') {
                        walk(full);
                    }
                } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
                    files.push(full);
                }
            }
        };
        walk(dir);

        return files
            .slice(0, 8)
            .map((f) => {
                const content = readFileSync(f, 'utf-8');
                const truncated =
                    content.length > 3000 ? content.slice(0, 3000) + '\n// ... truncated' : content;
                return `--- ${f} ---\n${truncated}`;
            })
            .join('\n\n');
    }

    /**
     * Builds a prompt string for a given section using config templates
     */
    buildPrompt(section, extName, rawContent, sourceCode, extInfo) {
        const templateDef = config.prompts[section];
        if (!templateDef) {
            return `Describe the "${section}" aspect of the ${extName} extension.`;
        }

        const vars = {
            name: extName,
            category: extInfo.category || 'unknown',
            nodes: extInfo.nodes?.join(', ') || 'none',
            marks: extInfo.marks?.join(', ') || 'none',
            actions: extInfo.actions?.join(', ') || 'none',
            presets: extInfo.presets?.join(', ') || 'not in standard presets',
            inputRules: extInfo.inputRules?.join(', ') || 'none',
            serializerHints: extInfo.serializerHints?.join(', ') || 'none',
            markupExamples: extInfo.markupExamples?.map((e) => `- \`${e}\``).join('\n') || 'none',
            sourceCode,
            rawContent,
        };

        const interpolate = (tpl) => tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
        return `${interpolate(templateDef.system)}\n\n${interpolate(templateDef.user)}`;
    }
}

export {readExtensionsIR};

import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';

import {config, isInternalExtension} from './config.mjs';
import {logger} from './logger.mjs';
import {parseFrontmatter, slugify, stripFrontmatter, yamlQuote} from './utils.mjs';

const {order: CATEGORY_ORDER, labels: CATEGORY_LABELS} = config.categories;
const AI_SECTION_RE = /<!-- AI:(?:NEEDED|FAILED):\w+ -->/;

/**
 * Assembles enriched/raw extension docs into the docs-src/ output directory
 */
export class Assembler {
    constructor(docsGenDir, outDir) {
        this.docsGenDir = docsGenDir;
        this.rawDir = join(docsGenDir, 'raw');
        this.enrichedDir = join(docsGenDir, 'enriched');
        this.irPath = join(docsGenDir, 'extensions.json');
        this.outDir = outDir;
        this.extensionsOutDir = join(outDir, 'extensions');
    }

    /**
     * Runs the full assembly pipeline
     */
    run() {
        if (!existsSync(this.rawDir)) {
            const message = `${this.rawDir} not found. Run extract first.`;
            logger.error(message);
            throw new Error(message);
        }
        if (!existsSync(this.outDir)) {
            const message = `${this.outDir} not found. Run generate first.`;
            logger.error(message);
            throw new Error(message);
        }

        const extensions = existsSync(this.irPath)
            ? JSON.parse(readFileSync(this.irPath, 'utf-8'))
            : [];
        const publishableExtensions = this.getPublishableExtensions(extensions);

        const version = this.resolveVersion(publishableExtensions);
        logger.info(`Assembling extension docs for v${version}...`);

        const docs = this.collectDocs();
        logger.info(
            `Found ${docs.rawDocs.size} raw docs and ${docs.enrichedDocs.size} enriched docs`,
        );

        const publishDocs = this.validateDocs(docs, publishableExtensions);
        const pages = this.writePages(publishDocs, publishableExtensions);
        this.writeIndex(pages, publishableExtensions, version);

        const tocItems = this.generateTocItems(pages);
        this.patchTocYaml(tocItems);
        this.patchIndexMd(version);

        logger.success(`Assembled ${pages.length} extension pages in ${this.extensionsOutDir}/`);
        logger.info('Updated toc.yaml and index.md');
    }

    /**
     * Collects docs preferring enriched over raw
     */
    collectDocs() {
        const rawDocs = new Map();
        const enrichedDocs = new Map();

        if (existsSync(this.rawDir)) {
            for (const file of readdirSync(this.rawDir).filter((f) => f.endsWith('.md'))) {
                const name = basename(file, '.md');
                rawDocs.set(name, {
                    name,
                    content: readFileSync(join(this.rawDir, file), 'utf-8'),
                });
            }
        }

        if (existsSync(this.enrichedDir)) {
            for (const file of readdirSync(this.enrichedDir).filter((f) => f.endsWith('.md'))) {
                const name = basename(file, '.md');
                enrichedDocs.set(name, {
                    name,
                    content: readFileSync(join(this.enrichedDir, file), 'utf-8'),
                });
            }
        }

        return {rawDocs, enrichedDocs};
    }

    getPublishableExtensions(extensions) {
        return extensions.filter((extension) => !isInternalExtension(extension.name));
    }

    validateDocs(docs, extensions) {
        const publishDocs = new Map();
        const expectedNames = new Set(extensions.map((extension) => extension.name));
        const orphanDocs = [...docs.enrichedDocs.keys()].filter((name) => !expectedNames.has(name));

        if (orphanDocs.length > 0) {
            const message = `Found orphan enriched docs: ${orphanDocs.sort().join(', ')}`;
            logger.error(message);
            throw new Error(message);
        }

        const missingEnriched = [];
        for (const extension of extensions) {
            if (!docs.enrichedDocs.has(extension.name)) {
                missingEnriched.push(extension.name);
                continue;
            }

            const doc = docs.enrichedDocs.get(extension.name);
            if (AI_SECTION_RE.test(doc.content)) {
                const message = `Enriched doc for ${extension.name} still contains unresolved AI markers`;
                logger.error(message);
                throw new Error(message);
            }
            publishDocs.set(extension.name, doc);
        }

        if (missingEnriched.length > 0) {
            const message = `Missing enriched docs for publishable extensions: ${missingEnriched.sort().join(', ')}`;
            logger.error(message);
            throw new Error(message);
        }

        return publishDocs;
    }

    /**
     * Writes individual extension pages to docs-src/extensions/
     */
    writePages(docs, extensions) {
        rmSync(this.extensionsOutDir, {recursive: true, force: true});
        mkdirSync(this.extensionsOutDir, {recursive: true});
        const pages = [];

        for (const extInfo of extensions) {
            const doc = docs.get(extInfo.name);
            if (!doc) continue;

            const name = extInfo.name;
            const category = extInfo.category || parseFrontmatter(doc.content).category || 'other';

            const slug = slugify(name);
            writeFileSync(join(this.extensionsOutDir, `${slug}.md`), stripFrontmatter(doc.content));

            pages.push({
                name,
                slug,
                category,
                relativePath: `extensions/${slug}.md`,
                hasNodes: extInfo?.nodes?.length > 0,
                hasMarks: extInfo?.marks?.length > 0,
                hasActions: extInfo?.actions?.length > 0,
                source: 'enriched',
            });
        }

        return pages;
    }

    /**
     * Writes the extensions index page with categorized tables
     */
    writeIndex(pages, extensions, version) {
        const lines = [
            '# Extensions Reference',
            '',
            `Documentation generated for \`@gravity-ui/markdown-editor@${version}\`.`,
            '',
        ];

        for (const category of CATEGORY_ORDER) {
            const categoryPages = pages
                .filter((p) => p.category === category)
                .sort((a, b) => a.name.localeCompare(b.name));
            if (categoryPages.length === 0) continue;

            lines.push(`## ${CATEGORY_LABELS[category]} Extensions`, '');
            lines.push('| Extension | Nodes | Marks | Actions |');
            lines.push('|-----------|-------|-------|---------|');

            for (const page of categoryPages) {
                const ext = extensions.find((e) => e.name === page.name);
                const nodes = ext?.nodes?.join(', ') || '-';
                const marks = ext?.marks?.join(', ') || '-';
                const actions = ext?.actions?.length || 0;
                lines.push(
                    `| [${page.name}](${page.relativePath}) | ${nodes} | ${marks} | ${actions} |`,
                );
            }
            lines.push('');
        }

        writeFileSync(join(this.outDir, 'extensions-index.md'), lines.join('\n'));
    }

    /**
     * Generates YAML toc entries for the extensions section
     */
    generateTocItems(pages) {
        const lines = [];
        lines.push('  - name: Extensions');
        lines.push('    href: extensions-index.md');
        lines.push('    items:');

        for (const category of CATEGORY_ORDER) {
            const categoryPages = pages
                .filter((p) => p.category === category)
                .sort((a, b) => a.name.localeCompare(b.name));
            if (categoryPages.length === 0) continue;

            lines.push(`      - name: ${yamlQuote(CATEGORY_LABELS[category])}`);
            lines.push('        items:');
            for (const page of categoryPages) {
                lines.push(`          - name: ${yamlQuote(page.name)}`);
                lines.push(`            href: ${page.relativePath}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Patches toc.yaml to include the extensions section
     */
    patchTocYaml(extensionsTocItems) {
        const tocPath = join(this.outDir, 'toc.yaml');

        if (!existsSync(tocPath)) {
            logger.warn('toc.yaml not found, creating minimal version');
            const content =
                [
                    'title: Markdown Editor',
                    'href: index.md',
                    'items:',
                    '  - name: Overview',
                    '    href: index.md',
                    extensionsTocItems,
                ].join('\n') + '\n';
            writeFileSync(tocPath, content);
            return;
        }

        let content = readFileSync(tocPath, 'utf-8');
        // Remove previous Extensions section before appending fresh one
        const extSectionRe = /\n {2}- name: Extensions\n[\s\S]*?(?=\n {2}- name:|\n?$)/;
        content = content.replace(extSectionRe, '');
        content = content.trimEnd() + '\n' + extensionsTocItems + '\n';
        writeFileSync(tocPath, content);
    }

    /**
     * Patches index.md to add a link to the extensions reference
     */
    patchIndexMd(version) {
        const indexPath = join(this.outDir, 'index.md');
        if (!existsSync(indexPath)) return;

        let content = readFileSync(indexPath, 'utf-8');
        content = content.replace(/\n## Extensions[\s\S]*?(?=\n## |\n?$)/, '');
        content = content.trimEnd() + '\n\n## Extensions\n\n';
        content += `- [Extensions Reference](extensions-index.md) (v${version})\n`;
        writeFileSync(indexPath, content);
    }

    /**
     * Reads version from the first extension's raw doc frontmatter
     */
    resolveVersion(extensions) {
        if (extensions[0]) {
            const raw = join(this.rawDir, `${extensions[0].name}.md`);
            if (existsSync(raw)) {
                return parseFrontmatter(readFileSync(raw, 'utf-8')).version || 'unknown';
            }
        }
        return 'unknown';
    }
}

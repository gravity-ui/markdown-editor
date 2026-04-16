import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';
import process from 'node:process';

import {config} from './config.mjs';
import {logger} from './logger.mjs';
import {parseFrontmatter, slugify, stripFrontmatter, yamlQuote} from './utils.mjs';

const {order: CATEGORY_ORDER, labels: CATEGORY_LABELS} = config.categories;

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
            logger.error(`${this.rawDir} not found. Run extract first.`);
            process.exit(1);
        }
        if (!existsSync(this.outDir)) {
            logger.error(`${this.outDir} not found. Run generate first.`);
            process.exit(1);
        }

        const extensions = existsSync(this.irPath)
            ? JSON.parse(readFileSync(this.irPath, 'utf-8'))
            : [];

        const version = this.resolveVersion(extensions);
        logger.info(`Assembling extension docs for v${version}...`);

        const docs = this.collectDocs();
        logger.info(
            `Found ${docs.size} extension docs (enriched: ${[...docs.values()].filter((d) => d.source === 'enriched').length})`,
        );

        const pages = this.writePages(docs, extensions);
        this.writeIndex(pages, extensions, version);

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
        const docs = new Map();

        if (existsSync(this.rawDir)) {
            for (const file of readdirSync(this.rawDir).filter((f) => f.endsWith('.md'))) {
                const name = basename(file, '.md');
                docs.set(name, {
                    name,
                    source: 'raw',
                    content: readFileSync(join(this.rawDir, file), 'utf-8'),
                });
            }
        }

        if (existsSync(this.enrichedDir)) {
            for (const file of readdirSync(this.enrichedDir).filter((f) => f.endsWith('.md'))) {
                const name = basename(file, '.md');
                docs.set(name, {
                    name,
                    source: 'enriched',
                    content: readFileSync(join(this.enrichedDir, file), 'utf-8'),
                });
            }
        }

        return docs;
    }

    /**
     * Writes individual extension pages to docs-src/extensions/
     */
    writePages(docs, extensions) {
        mkdirSync(this.extensionsOutDir, {recursive: true});
        const pages = [];

        for (const [name, doc] of docs) {
            const extInfo = extensions.find((e) => e.name === name);
            const category = extInfo?.category || parseFrontmatter(doc.content).category || 'other';

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
                source: doc.source,
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

import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import process from 'node:process';

import {logger} from './logger.mjs';
import {slugify, yamlQuote} from './utils.mjs';

// Source docs use ##### as a metadata header: "##### Category / Title"
const HEADER_RE = /^#{5}\s+(.+)$/;

const GITHUB_RAW_RE =
    /https:\/\/raw\.githubusercontent\.com\/gravity-ui\/markdown-editor\/(?:refs\/heads\/[^/]+|[^/]+)\/docs\//g;

/**
 * Generates the Diplodoc docs-src/ site from hand-written docs/ markdown files
 */
export class Generator {
    constructor(docsDir, outDir) {
        this.docsDir = docsDir;
        this.outDir = outDir;
    }

    /**
     * Runs the full generation pipeline
     */
    run() {
        this.clean();

        const docs = this.collectDocs();
        const {categories, topLevel} = this.groupByCategory(docs);

        this.writeYfmConfig();
        this.writeDocFiles(docs);
        this.writeTocYaml(categories, topLevel);
        this.writeIndexMd(categories, topLevel);
        this.copyAssets();

        logger.success(
            `Generated docs-src/: ${docs.length} pages in ${categories.size} categories + ${topLevel.length} top-level`,
        );
    }

    /**
     * Removes and recreates the output directory
     */
    clean() {
        if (existsSync(this.outDir)) {
            rmSync(this.outDir, {recursive: true, force: true});
        }
        mkdirSync(this.outDir, {recursive: true});
    }

    /**
     * Reads all markdown files and parses their ##### headers
     */
    collectDocs() {
        if (!existsSync(this.docsDir)) {
            logger.error(`source directory "${this.docsDir}" does not exist`);
            process.exit(1);
        }

        const files = readdirSync(this.docsDir)
            .filter((f) => f.endsWith('.md'))
            .sort();
        const docs = [];

        for (const file of files) {
            const content = readFileSync(join(this.docsDir, file), 'utf-8');
            const lines = content.split('\n');
            const parsed = this.parseHeader(lines[0]);

            if (!parsed) {
                logger.warn(`Skipping ${file}: no ##### header found`);
                continue;
            }

            docs.push({
                sourceFile: file,
                category: parsed.category,
                title: parsed.title,
                content: lines.slice(1).join('\n').replace(/^\n+/, ''),
            });
        }

        return docs;
    }

    /**
     * Extracts category and title from a ##### header line
     */
    parseHeader(firstLine) {
        const match = firstLine.match(HEADER_RE);
        if (!match) return null;

        const raw = match[1].trim();
        const parts = raw.split('/').map((s) => s.trim());
        return parts.length === 2
            ? {category: parts[0], title: parts[1]}
            : {category: null, title: parts[0]};
    }

    /**
     * Splits docs into categorized and top-level groups
     */
    groupByCategory(docs) {
        const categories = new Map();
        const topLevel = [];

        for (const doc of docs) {
            if (doc.category) {
                if (!categories.has(doc.category)) categories.set(doc.category, []);
                categories.get(doc.category).push(doc);
            } else {
                topLevel.push(doc);
            }
        }

        return {categories, topLevel};
    }

    /**
     * Computes relative output path from doc category and title slugs
     */
    computeOutputPath(doc) {
        if (doc.category) {
            return join(slugify(doc.category), slugify(doc.title) + '.md');
        }
        return slugify(doc.title) + '.md';
    }

    /**
     * Rewrites absolute GitHub raw URLs to relative paths
     */
    rewriteAssetUrls(content, doc) {
        const prefix = doc.category ? '../' : './';
        return content.replace(GITHUB_RAW_RE, prefix);
    }

    /**
     * Writes all doc pages, checking for duplicate output paths
     */
    writeDocFiles(docs) {
        const seen = new Map();
        for (const doc of docs) {
            const outPath = this.computeOutputPath(doc);
            if (seen.has(outPath)) {
                logger.error(
                    `duplicate output path "${outPath}" from "${doc.sourceFile}" and "${seen.get(outPath)}"`,
                );
                process.exit(1);
            }
            seen.set(outPath, doc.sourceFile);
        }

        for (const doc of docs) {
            const outPath = join(this.outDir, this.computeOutputPath(doc));
            mkdirSync(dirname(outPath), {recursive: true});
            writeFileSync(outPath, this.rewriteAssetUrls(doc.content, doc));
        }
    }

    /**
     * Generates toc.yaml for the Diplodoc site
     */
    writeTocYaml(categories, topLevel) {
        const lines = [
            'title: Markdown Editor',
            'href: index.md',
            'items:',
            '  - name: Overview',
            '    href: index.md',
        ];

        for (const [category, docs] of categories) {
            lines.push(`  - name: ${yamlQuote(category)}`);
            lines.push('    items:');
            for (const doc of docs) {
                lines.push(`      - name: ${yamlQuote(doc.title)}`);
                lines.push(`        href: ${this.computeOutputPath(doc)}`);
            }
        }

        for (const doc of topLevel) {
            lines.push(`  - name: ${yamlQuote(doc.title)}`);
            lines.push(`    href: ${this.computeOutputPath(doc)}`);
        }

        writeFileSync(join(this.outDir, 'toc.yaml'), lines.join('\n') + '\n');
    }

    /**
     * Generates the index.md landing page
     */
    writeIndexMd(categories, topLevel) {
        const lines = [
            '# Markdown Editor',
            '',
            'Documentation for the Gravity UI Markdown Editor.',
            '',
        ];

        for (const [category, docs] of categories) {
            lines.push(`## ${category}`, '');
            for (const doc of docs) {
                lines.push(`- [${doc.title}](${this.computeOutputPath(doc)})`);
            }
            lines.push('');
        }

        if (topLevel.length > 0) {
            for (const doc of topLevel) {
                lines.push(`- [${doc.title}](${this.computeOutputPath(doc)})`);
            }
            lines.push('');
        }

        writeFileSync(join(this.outDir, 'index.md'), lines.join('\n'));
    }

    /**
     * Copies the assets/ directory to the output
     */
    copyAssets() {
        const assetsDir = join(this.docsDir, 'assets');
        if (existsSync(assetsDir)) {
            cpSync(assetsDir, join(this.outDir, 'assets'), {recursive: true});
        }
    }

    /**
     * Writes the .yfm Diplodoc config file
     */
    writeYfmConfig() {
        writeFileSync(join(this.outDir, '.yfm'), 'allowHTML: true\n');
    }
}

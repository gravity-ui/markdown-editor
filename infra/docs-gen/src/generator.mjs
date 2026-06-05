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

const GITHUB_RAW_RE =
    /https:\/\/raw\.githubusercontent\.com\/gravity-ui\/markdown-editor\/(?:refs\/heads\/[^/]+|[^/]+)\/docs\//g;

// Source docs use ##### as a metadata header (not rendered).
// Format: "##### Category / Title" or "##### Title" (no category).
const HEADER_RE = /^#{5}\s+(.+)$/;

function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function yamlQuote(str) {
    if (/[:#"'{}[\],&*?|>!%@`]/.test(str)) {
        return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    return str;
}

export class Generator {
    constructor(docsDir, outDir) {
        this.docsDir = docsDir;
        this.outDir = outDir;
    }

    run() {
        this.cleanOutDir();

        const docs = this.collectDocs();
        const {categories, topLevel} = this.groupByCategory(docs);

        this.writeYfmConfig();
        this.writeDocFiles(docs);
        this.generateTocYaml(categories, topLevel);
        this.generateIndexMd(categories, topLevel);
        this.copyAssets();

        console.info(
            `Generated docs-src/: ${docs.length} pages in ${categories.size} categories + ${topLevel.length} top-level`,
        );
    }

    parseHeader(firstLine) {
        const match = firstLine.match(HEADER_RE);

        if (!match) {
            return null;
        }

        const raw = match[1].trim();
        const parts = raw.split('/').map((part) => part.trim());

        if (parts.length === 2) {
            return {category: parts[0], title: parts[1]};
        }

        return {category: null, title: parts[0]};
    }

    cleanOutDir() {
        if (existsSync(this.outDir)) {
            rmSync(this.outDir, {recursive: true, force: true});
        }

        mkdirSync(this.outDir, {recursive: true});
    }

    collectDocs() {
        if (!existsSync(this.docsDir)) {
            throw new Error(`source directory "${this.docsDir}" does not exist`);
        }

        const files = readdirSync(this.docsDir)
            .filter((file) => file.endsWith('.md'))
            .sort();
        const docs = [];

        for (const file of files) {
            const content = readFileSync(join(this.docsDir, file), 'utf-8');
            const lines = content.split('\n');
            const parsed = this.parseHeader(lines[0]);

            if (!parsed) {
                console.warn(`Skipping ${file}: no ##### header found`);
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

    groupByCategory(docs) {
        const categories = new Map();
        const topLevel = [];

        for (const doc of docs) {
            if (doc.category) {
                if (!categories.has(doc.category)) {
                    categories.set(doc.category, []);
                }

                categories.get(doc.category).push(doc);
            } else {
                topLevel.push(doc);
            }
        }

        return {categories, topLevel};
    }

    computeOutputPath(doc) {
        if (doc.category) {
            return join(slugify(doc.category), `${slugify(doc.title)}.md`);
        }

        return `${slugify(doc.title)}.md`;
    }

    // Fail early when two source docs would overwrite the same generated page.
    checkDuplicatePaths(docs) {
        const seen = new Map();

        for (const doc of docs) {
            const outPath = this.computeOutputPath(doc);

            if (seen.has(outPath)) {
                throw new Error(
                    `duplicate output path "${outPath}" from "${doc.sourceFile}" and "${seen.get(outPath)}"`,
                );
            }

            seen.set(outPath, doc.sourceFile);
        }
    }

    // Generated pages can be nested by category, so raw GitHub docs/ asset URLs
    // need different relative prefixes depending on the output depth.
    rewriteAssetUrls(content, doc) {
        const prefix = doc.category ? '../' : './';

        return content.replace(GITHUB_RAW_RE, prefix);
    }

    writeDocFiles(docs) {
        this.checkDuplicatePaths(docs);

        for (const doc of docs) {
            const outPath = join(this.outDir, this.computeOutputPath(doc));

            mkdirSync(dirname(outPath), {recursive: true});
            writeFileSync(outPath, this.rewriteAssetUrls(doc.content, doc));
        }
    }

    generateTocYaml(categories, topLevel) {
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

        writeFileSync(join(this.outDir, 'toc.yaml'), `${lines.join('\n')}\n`);
    }

    generateIndexMd(categories, topLevel) {
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

    copyAssets() {
        const assetsDir = join(this.docsDir, 'assets');

        if (existsSync(assetsDir)) {
            cpSync(assetsDir, join(this.outDir, 'assets'), {recursive: true});
        }
    }

    writeYfmConfig() {
        writeFileSync(join(this.outDir, '.yfm'), 'allowHTML: true\n');
    }
}

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

const DOCS_DIR = 'docs';
const OUT_DIR = 'docs-src';
const GITHUB_RAW_RE =
    /https:\/\/raw\.githubusercontent\.com\/gravity-ui\/markdown-editor\/(?:refs\/heads\/[^/]+|[^/]+)\/docs\//g;

// Source docs use ##### as a metadata header (not rendered).
// Format: "##### Category / Title" or "##### Title" (no category).
// This line is stripped from the output; the rest becomes the page content.
const HEADER_RE = /^#{5}\s+(.+)$/;

/**
 * Converts a string to a URL-friendly slug (lowercase, alphanumeric, hyphens).
 * @param str
 */
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Extracts category and title from a `##### Category / Title` header line.
 * @param firstLine
 */
function parseHeader(firstLine) {
    const match = firstLine.match(HEADER_RE);
    if (!match) return null;

    const raw = match[1].trim();
    const parts = raw.split('/').map((s) => s.trim());

    if (parts.length === 2) {
        return {category: parts[0], title: parts[1]};
    }
    return {category: null, title: parts[0]};
}

/** Removes all generated content from the output directory. */
function cleanOutDir() {
    if (existsSync(OUT_DIR)) {
        rmSync(OUT_DIR, {recursive: true, force: true});
    }
    mkdirSync(OUT_DIR, {recursive: true});
}

/** Reads all markdown files from the source directory and parses their headers. */
function collectDocs() {
    if (!existsSync(DOCS_DIR)) {
        console.error(`Error: source directory "${DOCS_DIR}" does not exist`);
        process.exit(1);
    }

    const files = readdirSync(DOCS_DIR)
        .filter((f) => f.endsWith('.md'))
        .sort();
    const docs = [];

    for (const file of files) {
        const content = readFileSync(join(DOCS_DIR, file), 'utf-8');
        const lines = content.split('\n');
        const parsed = parseHeader(lines[0]);

        if (!parsed) {
            console.warn(`Skipping ${file}: no ##### header found`);
            continue;
        }

        const strippedContent = lines.slice(1).join('\n').replace(/^\n+/, '');

        docs.push({
            sourceFile: file,
            category: parsed.category,
            title: parsed.title,
            content: strippedContent,
        });
    }

    return docs;
}

/**
 * Splits docs into a category map and a top-level (uncategorized) list.
 * @param docs
 */
function groupByCategory(docs) {
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

/**
 * Builds a relative output file path from the doc's category and title slugs.
 * @param doc
 */
function computeOutputPath(doc) {
    if (doc.category) {
        return join(slugify(doc.category), slugify(doc.title) + '.md');
    }
    return slugify(doc.title) + '.md';
}

/**
 * Ensures no two docs resolve to the same output path; exits on collision.
 * @param docs
 */
function checkDuplicatePaths(docs) {
    const seen = new Map();
    for (const doc of docs) {
        const outPath = computeOutputPath(doc);
        if (seen.has(outPath)) {
            console.error(
                `Error: duplicate output path "${outPath}" from "${doc.sourceFile}" and "${seen.get(outPath)}"`,
            );
            process.exit(1);
        }
        seen.set(outPath, doc.sourceFile);
    }
}

/**
 * Rewrites absolute GitHub raw URLs to relative paths based on doc nesting depth.
 * @param content
 * @param doc
 */
function rewriteAssetUrls(content, doc) {
    const prefix = doc.category ? '../' : './';
    return content.replace(GITHUB_RAW_RE, prefix);
}

/**
 * Writes stripped markdown content to categorized output paths.
 * @param docs
 */
function writeDocFiles(docs) {
    checkDuplicatePaths(docs);
    for (const doc of docs) {
        const outPath = join(OUT_DIR, computeOutputPath(doc));
        mkdirSync(dirname(outPath), {recursive: true});
        writeFileSync(outPath, rewriteAssetUrls(doc.content, doc));
    }
}

/**
 * Wraps a string in double quotes if it contains YAML special characters.
 * @param str
 */
function yamlQuote(str) {
    if (/[:#"'{}[\],&*?|>!%@`]/.test(str)) {
        return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return str;
}

/**
 * Generates the `toc.yaml` table of contents for the YFM documentation site.
 * @param categories
 * @param topLevel
 */
function generateTocYaml(categories, topLevel) {
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
            lines.push(`        href: ${computeOutputPath(doc)}`);
        }
    }

    for (const doc of topLevel) {
        lines.push(`  - name: ${yamlQuote(doc.title)}`);
        lines.push(`    href: ${computeOutputPath(doc)}`);
    }

    writeFileSync(join(OUT_DIR, 'toc.yaml'), lines.join('\n') + '\n');
}

/**
 * Generates the `index.md` landing page with links to all doc pages.
 * @param categories
 * @param topLevel
 */
function generateIndexMd(categories, topLevel) {
    const lines = [
        '# Markdown Editor',
        '',
        'Documentation for the Gravity UI Markdown Editor.',
        '',
    ];

    for (const [category, docs] of categories) {
        lines.push(`## ${category}`, '');
        for (const doc of docs) {
            lines.push(`- [${doc.title}](${computeOutputPath(doc)})`);
        }
        lines.push('');
    }

    if (topLevel.length > 0) {
        for (const doc of topLevel) {
            lines.push(`- [${doc.title}](${computeOutputPath(doc)})`);
        }
        lines.push('');
    }

    writeFileSync(join(OUT_DIR, 'index.md'), lines.join('\n'));
}

/** Copies the `assets/` directory from source docs to the output directory. */
function copyAssets() {
    const assetsDir = join(DOCS_DIR, 'assets');
    if (existsSync(assetsDir)) {
        cpSync(assetsDir, join(OUT_DIR, 'assets'), {recursive: true});
    }
}

/** Writes the `.yfm` Diplodoc config into the output directory. */
function writeYfmConfig() {
    writeFileSync(join(OUT_DIR, '.yfm'), 'allowHTML: true\n');
}

/** Entry point: cleans output, collects docs, and generates the documentation site. */
function main() {
    cleanOutDir();

    const docs = collectDocs();
    const {categories, topLevel} = groupByCategory(docs);

    writeYfmConfig();
    writeDocFiles(docs);
    generateTocYaml(categories, topLevel);
    generateIndexMd(categories, topLevel);
    copyAssets();

    const totalFiles = docs.length;
    const totalCategories = categories.size;
    // eslint-disable-next-line no-console
    console.log(
        `Generated docs-src/: ${totalFiles} pages in ${totalCategories} categories + ${topLevel.length} top-level`,
    );
}

main();

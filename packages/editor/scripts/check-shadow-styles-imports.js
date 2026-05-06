/* eslint-disable no-console, no-undef */
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const GULPFILE_URL = pathToFileURL(path.resolve(__dirname, '..', 'gulpfile.mjs')).href;

// Bare `import 'pkg/path/file.css';` — non-relative, scoped or unscoped, ending in .css.
const CSS_IMPORT_RE = /(?:^|\s)import\s+['"]((?:@[^'"\s/]+\/)?[^'"\s.][^'"\s]*\.css)['"]/gm;

const EXCLUDED_SCOPES = ['@gravity-ui/'];

async function main() {
    const {SHADOW_STYLE_IMPORTS} = await import(GULPFILE_URL);
    if (!Array.isArray(SHADOW_STYLE_IMPORTS)) {
        console.error('Failed to import SHADOW_STYLE_IMPORTS from gulpfile.mjs');
        process.exit(1);
    }

    const declared = new Set(SHADOW_STYLE_IMPORTS);
    const actual = collectCssImports(SRC_DIR);

    const missing = [...actual].filter((x) => !declared.has(x)).sort();
    const stale = [...declared].filter((x) => !actual.has(x)).sort();

    if (missing.length || stale.length) {
        console.error('Shadow styles imports drift detected:');
        if (missing.length) {
            console.error('  Missing in SHADOW_STYLE_IMPORTS (found in src, not in list):');
            for (const item of missing) console.error(`    + ${item}`);
        }
        if (stale.length) {
            console.error('  Stale in SHADOW_STYLE_IMPORTS (in list, not used in src):');
            for (const item of stale) console.error(`    - ${item}`);
        }
        console.error('Update SHADOW_STYLE_IMPORTS in packages/editor/gulpfile.mjs.');
        process.exit(1);
    }

    console.log(`Shadow styles imports check passed (count: ${declared.size})`);
    process.exit(0);
}

function collectCssImports(dir) {
    const result = new Set();
    walk(dir, (filePath) => {
        if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf8');
        for (const match of content.matchAll(CSS_IMPORT_RE)) {
            const spec = match[1];
            if (EXCLUDED_SCOPES.some((scope) => spec.startsWith(scope))) continue;
            result.add(spec);
        }
    });
    return result;
}

function walk(dir, visit) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, visit);
        else if (entry.isFile()) visit(full);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

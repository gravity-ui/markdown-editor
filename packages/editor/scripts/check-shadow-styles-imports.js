/* eslint-disable no-console, no-undef */
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const IMPORTS_MODULE_URL = pathToFileURL(path.resolve(__dirname, 'shadow-styles-imports.mjs')).href;

// A non-relative specifier ending in `.css` — scoped (`@scope/pkg/...`) or not — in an `import` or
// `export` at the start of a line. A `?query` suffix stays outside the capture group, so
// `pkg/x.css?inline` is reported as `pkg/x.css`.
// Out of reach: a specifier without the extension (`pkg/runtime/styles`), a dynamic `import()`, and
// an import inside a block comment.
const CSS_IMPORT_RE =
    /^\s*(?:import|export)\s+(?:[\w*\s{},]+\s+from\s+)?['"]((?:@[^'"\s/]+\/)?[^'"\s.][^'"\s?]*\.css)(?:\?[^'"]*)?['"]/gm;

async function main() {
    const {SHADOW_STYLE_IMPORTS} = await import(IMPORTS_MODULE_URL);
    const declared = new Set(SHADOW_STYLE_IMPORTS);
    const actual = collectCssImports(SRC_DIR);

    const missing = [...actual].filter((spec) => !declared.has(spec)).sort();
    const stale = [...declared].filter((spec) => !actual.has(spec)).sort();

    if (missing.length || stale.length) {
        console.error('Shadow styles imports drift detected:');
        for (const spec of missing) console.error(`  + ${spec} (imported in src, not in the list)`);
        for (const spec of stale) console.error(`  - ${spec} (in the list, not imported in src)`);
        console.error(
            'Update SHADOW_STYLE_IMPORTS in packages/editor/scripts/shadow-styles-imports.mjs.',
        );
        process.exit(1);
    }

    console.log(`Shadow styles imports check passed (count: ${declared.size})`);
}

function collectCssImports(dir) {
    const specs = new Set();
    walk(dir, (filePath) => {
        if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) return;
        for (const match of fs.readFileSync(filePath, 'utf8').matchAll(CSS_IMPORT_RE)) {
            specs.add(match[1]);
        }
    });
    return specs;
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

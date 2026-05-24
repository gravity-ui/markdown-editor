/* eslint-disable no-console, no-undef */
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const IMPORTS_MODULE_URL = pathToFileURL(path.resolve(__dirname, 'shadow-styles-imports.mjs')).href;

// Capture group `(...\.css)` — non-relative specifier ending in .css:
// scoped (`@scope/pkg/...`) or unscoped (`pkg/...`). Anchored to start-of-line
// (with optional whitespace) so matches inside string literals can't pollute
// results. Two regexes — static and dynamic — for readability.
const CSS_PATH = "((?:@[^'\"\\s/]+/)?[^'\"\\s.][^'\"\\s]*\\.css)";

//   import 'pkg/x.css';
//   import x from 'pkg/x.css';
//   import * as x from 'pkg/x.css';
//   import {x} from 'pkg/x.css';
const STATIC_CSS_IMPORT_RE = new RegExp(
    `^\\s*import\\s+(?:[\\w*\\s{},]+\\s+from\\s+)?['"]${CSS_PATH}['"]`,
    'gm',
);

//   import('pkg/x.css')
//   await import('pkg/x.css')
const DYNAMIC_CSS_IMPORT_RE = new RegExp(`\\bimport\\s*\\(\\s*['"]${CSS_PATH}['"]`, 'g');

const EXCLUDED_SCOPES = ['@gravity-ui/'];

async function main() {
    const {SHADOW_STYLE_IMPORTS} = await import(IMPORTS_MODULE_URL);
    if (!Array.isArray(SHADOW_STYLE_IMPORTS)) {
        console.error('Failed to import SHADOW_STYLE_IMPORTS from shadow-styles-imports.mjs');
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
        console.error('Update SHADOW_STYLE_IMPORTS in packages/editor/scripts/shadow-styles-imports.mjs.');
        process.exit(1);
    }

    console.log(`Shadow styles imports check passed (count: ${declared.size})`);
    process.exit(0);
}

function collectCssImports(dir) {
    const result = new Set();
    walk(dir, (filePath) => {
        if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) return;
        const content = stripComments(fs.readFileSync(filePath, 'utf8'));
        for (const re of [STATIC_CSS_IMPORT_RE, DYNAMIC_CSS_IMPORT_RE]) {
            for (const match of content.matchAll(re)) {
                const spec = match[1];
                if (EXCLUDED_SCOPES.some((scope) => spec.startsWith(scope))) continue;
                result.add(spec);
            }
        }
    });
    return result;
}

// Strip block and line comments so commented-out imports don't show up as
// drift. Naive replace — acceptable because we never *add* matches by stripping,
// only remove potential matches. The only edge case is a regex literal like
// `/foo\/\/bar/` whose `//` would be mistaken for a line comment, but no
// `import 'pkg/x.css'` can live inside a regex literal anyway.
function stripComments(source) {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n\r]*/g, '');
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

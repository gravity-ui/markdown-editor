/* eslint-disable no-console, no-undef */
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const ts = require('typescript');

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const IMPORTS_MODULE_URL = pathToFileURL(path.resolve(__dirname, 'shadow-styles-imports.mjs')).href;

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
        const source = ts.createSourceFile(
            filePath,
            fs.readFileSync(filePath, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
        );

        function visit(node) {
            let specifier;
            if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
                specifier = node.moduleSpecifier;
            } else if (
                ts.isCallExpression(node) &&
                node.expression.kind === ts.SyntaxKind.ImportKeyword
            ) {
                [specifier] = node.arguments;
            }

            if (specifier && ts.isStringLiteralLike(specifier)) {
                const spec = specifier.text.split(/[?#]/, 1)[0];
                if (!/^[./]/.test(spec) && spec.endsWith('.css')) specs.add(spec);
            }
            ts.forEachChild(node, visit);
        }

        visit(source);
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

module.exports = {collectCssImports};

if (require.main === module) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

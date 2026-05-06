import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {parallel, series, task} from '@markdown-editor/gulp-tasks';
import {registerBuildTasks} from '@markdown-editor/gulp-tasks/build';

import pkg from './package.json' with {type: 'json'};

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const BUILD_DIR = resolve('build');
const NODE_MODULES_DIR = resolve(__dirname, 'node_modules');
// Keep this list aligned with non-relative CSS imports required by the default editor setup.
// Drift is enforced by scripts/check-shadow-styles-imports.js.
export const SHADOW_STYLE_IMPORTS = Object.freeze([
    '@diplodoc/transform/dist/css/base.css',
    '@diplodoc/transform/dist/css/_yfm-only.css',
    '@diplodoc/cut-extension/runtime/styles.css',
    '@diplodoc/file-extension/runtime/styles.css',
    '@diplodoc/tabs-extension/runtime/styles.css',
    '@diplodoc/quote-link-extension/runtime/styles.css',
    '@diplodoc/folding-headings-extension/runtime/styles.css',
]);

const OPTIONAL_PEERS = new Set(
    Object.entries(pkg.peerDependenciesMeta ?? {})
        .filter(([, meta]) => meta?.optional)
        .map(([name]) => name),
);

registerBuildTasks({
    version: pkg.version,
    buildDir: BUILD_DIR,
    nodeModulesDir: NODE_MODULES_DIR,
});

task('shadow-styles', (done) => {
    const externalCss = readExternalShadowStyles();
    const editorCss = readFileSync(resolve(BUILD_DIR, 'styles.css'), 'utf8');
    const styles = [externalCss, editorCss].filter(Boolean).join('\n');
    const moduleCode = createShadowStylesModule(styles);

    writeFileSync(resolve(BUILD_DIR, 'shadow-styles.mjs'), moduleCode.esm);
    writeFileSync(resolve(BUILD_DIR, 'shadow-styles.cjs'), moduleCode.cjs);
    writeFileSync(
        resolve(BUILD_DIR, 'shadow-styles.d.ts'),
        [
            'export declare const cssText: string;',
            'export declare function createStyleSheet(): CSSStyleSheet;',
            '',
        ].join('\n'),
    );
    done();
});

task('build', series(parallel('ts', 'json', 'scss'), 'shadow-styles'));
task('default', series('clean', 'build'));

function readExternalShadowStyles() {
    return SHADOW_STYLE_IMPORTS.map((cssImport) => {
        try {
            return readFileSync(require.resolve(cssImport), 'utf8');
        } catch (err) {
            if (err?.code === 'MODULE_NOT_FOUND' && isOptionalPeerImport(cssImport)) {
                console.warn(
                    `[shadow-styles] Skipping optional peer CSS '${cssImport}' (package not installed).`,
                );
                return '';
            }
            throw err;
        }
    })
        .filter(Boolean)
        .join('\n');
}

function isOptionalPeerImport(cssImport) {
    const pkgName = cssImport.startsWith('@')
        ? cssImport.split('/', 2).join('/')
        : cssImport.split('/', 1)[0];
    return OPTIONAL_PEERS.has(pkgName);
}

function createShadowStylesModule(value) {
    const cssText = toTemplateLiteral(value);
    const createStyleSheetBody = [
        'function createStyleSheet() {',
        "    if (typeof CSSStyleSheet === 'undefined') {",
        "        throw new Error('Constructable stylesheets are not available in this environment.');",
        '    }',
        '    const styleSheet = new CSSStyleSheet();',
        '    styleSheet.replaceSync(cssText);',
        '    return styleSheet;',
        '}',
    ].join('\n');

    return {
        esm: [`export const cssText = ${cssText};`, '', `export ${createStyleSheetBody}`, ''].join(
            '\n',
        ),
        cjs: [
            `const cssText = ${cssText};`,
            '',
            createStyleSheetBody,
            '',
            'exports.cssText = cssText;',
            'exports.createStyleSheet = createStyleSheet;',
            '',
        ].join('\n'),
    };
}

function toTemplateLiteral(value) {
    return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}

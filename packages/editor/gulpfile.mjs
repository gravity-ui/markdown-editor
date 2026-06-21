import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {parallel, series, task} from '@markdown-editor/gulp-tasks';
import {registerBuildTasks} from '@markdown-editor/gulp-tasks/build';

import pkg from './package.json' with {type: 'json'};
import {SHADOW_STYLE_IMPORTS} from './scripts/shadow-styles-imports.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const BUILD_DIR = resolve('build');
const NODE_MODULES_DIR = resolve(__dirname, 'node_modules');

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
    assertNoCssImportRules(styles);
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

// `CSSStyleSheet.replaceSync()` rejects `@import` rules. If any inlined CSS ever
// adds one, fail the build instead of letting consumers crash at runtime.
function assertNoCssImportRules(css) {
    const stripped = css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(["'])(?:\\.|(?!\1).)*\1/g, '');
    if (/(?:^|[\s;}])@import\b/m.test(stripped)) {
        throw new Error(
            "[shadow-styles] '@import' rules are not allowed in cssText: " +
                'CSSStyleSheet.replaceSync() would reject them at runtime. ' +
                'Inline the imported file into SHADOW_STYLE_IMPORTS instead.',
        );
    }
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

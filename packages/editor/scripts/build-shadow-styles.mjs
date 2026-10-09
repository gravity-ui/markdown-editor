import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

import {SHADOW_STYLE_IMPORTS} from './shadow-styles-imports.mjs';

const require = createRequire(import.meta.url);
let verificationQueue = Promise.resolve();

const CREATE_STYLE_SHEET = `function createStyleSheet() {
    if (typeof CSSStyleSheet === 'undefined') {
        throw new Error('Constructable stylesheets are not available in this environment.');
    }
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(cssText);
    return styleSheet;
}`;

const TYPE_DECLARATIONS = [
    'export declare const cssText: string;',
    'export declare function createStyleSheet(): CSSStyleSheet;',
    '',
].join('\n');

/**
 * Writes `build/shadow-styles.{mjs,cjs,d.mts,d.cts}`, then loads both modules back to verify them.
 * @param {string} buildDir Build output directory; `styles.css` in it comes from the `scss` task
 */
export async function buildShadowStyles(buildDir) {
    const externalCss = SHADOW_STYLE_IMPORTS.map((cssImport) =>
        readFileSync(require.resolve(cssImport), 'utf8'),
    ).join('\n');
    const cssText = [externalCss, readFileSync(resolve(buildDir, 'styles.css'), 'utf8')].join('\n');
    assertNoCssImportRules(cssText);

    const {esm, cjs} = createShadowStylesModule(cssText);
    writeFileSync(resolve(buildDir, 'shadow-styles.mjs'), esm);
    writeFileSync(resolve(buildDir, 'shadow-styles.cjs'), cjs);
    // The nearest package.json declares no `type`, so a single `.d.ts` would read as CommonJS
    // under the `import` condition as well.
    writeFileSync(resolve(buildDir, 'shadow-styles.d.mts'), TYPE_DECLARATIONS);
    writeFileSync(resolve(buildDir, 'shadow-styles.d.cts'), TYPE_DECLARATIONS);

    await verifyGeneratedModules(buildDir, cssText);
}

// `CSSStyleSheet.replaceSync()` drops `@import` rules, so inlined CSS that gains one loses the
// imported file. The collected CSS contains no `@import` outside comments.
function assertNoCssImportRules(css) {
    // Comments are removed first: in `/* text */@import` the rule has no separator in front of it.
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

    if (/(?:^|[\s;{}])@import\b/m.test(withoutComments)) {
        throw new Error(
            "[shadow-styles] '@import' in cssText: CSSStyleSheet.replaceSync() drops the rule, " +
                'and the imported file is lost. Add that file to SHADOW_STYLE_IMPORTS instead.',
        );
    }
}

function createShadowStylesModule(cssText) {
    const cssLiteral = JSON.stringify(cssText);

    return {
        esm: [`export const cssText = ${cssLiteral};`, '', `export ${CREATE_STYLE_SHEET}`, ''].join(
            '\n',
        ),
        cjs: [
            `const cssText = ${cssLiteral};`,
            '',
            CREATE_STYLE_SHEET,
            '',
            'exports.cssText = cssText;',
            'exports.createStyleSheet = createStyleSheet;',
            '',
        ].join('\n'),
    };
}

// The modules are generated code, and only a round trip proves the embedded CSS survives it.
function verifyGeneratedModules(buildDir, cssText) {
    // Only one verification may install the process-wide stub at a time.
    const verification = verificationQueue.then(() => verifyModules(buildDir, cssText));
    verificationQueue = verification.catch(() => {});
    return verification;
}

async function verifyModules(buildDir, cssText) {
    // Node has no `CSSStyleSheet`; the stub records what `replaceSync()` received.
    // A runtime that provides its own gets it back after the check.
    const nativeDescriptor = Reflect.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet');
    Object.defineProperty(globalThis, 'CSSStyleSheet', {
        configurable: nativeDescriptor?.configurable ?? true,
        enumerable: nativeDescriptor?.enumerable ?? false,
        writable: true,
        value: class {
            replaceSync(value) {
                this.cssText = value;
            }
        },
    });

    try {
        const modules = [
            ['CJS', require(resolve(buildDir, 'shadow-styles.cjs'))],
            ['ESM', await import(pathToFileURL(resolve(buildDir, 'shadow-styles.mjs')).href)],
        ];

        for (const [format, module] of modules) {
            if (module.cssText !== cssText || module.createStyleSheet().cssText !== cssText) {
                throw new Error(
                    `[shadow-styles] ${format} cssText differs from the collected CSS.`,
                );
            }
        }
    } finally {
        if (nativeDescriptor) {
            Object.defineProperty(globalThis, 'CSSStyleSheet', nativeDescriptor);
        } else {
            delete globalThis.CSSStyleSheet;
        }
    }
}

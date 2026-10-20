import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';

import {buildShadowStyles} from './build-shadow-styles.mjs';
import {collectCssImports} from './check-shadow-styles-imports.js';

function temporaryDirectory(t) {
    const dir = mkdtempSync(join(tmpdir(), 'shadow-styles-'));
    t.after(() => rmSync(dir, {recursive: true, force: true}));
    return dir;
}

test('should collect static and dynamic external CSS imports without comments or strings', (t) => {
    const dir = temporaryDirectory(t);
    writeFileSync(
        join(dir, 'styles.tsx'),
        [
            "import 'pkg/static.css';",
            "import sheet from 'pkg/binding.css?inline';",
            "export {sheet} from '@scope/pkg/export.css';",
            'void import(',
            "  /* before argument */ '@scope/pkg/dynamic.css?inline'",
            ');',
            'void import(`pkg/template.css`);',
            "void import('./local.css');",
            "void import('/absolute.css');",
            'void import(`pkg/${theme}.css`);',
            "// import 'pkg/line-comment.css';",
            "/* import 'pkg/block-comment.css'; */",
            'const example = "import \'pkg/string.css\';";',
        ].join('\n'),
    );

    assert.deepEqual([...collectCssImports(dir)].sort(), [
        '@scope/pkg/dynamic.css',
        '@scope/pkg/export.css',
        'pkg/binding.css',
        'pkg/static.css',
        'pkg/template.css',
    ]);
});

test('should preserve the stylesheet API across concurrent builds', async (t) => {
    const first = temporaryDirectory(t);
    const second = temporaryDirectory(t);
    writeFileSync(join(first, 'styles.css'), '.first { color: red; }');
    writeFileSync(join(second, 'styles.css'), '.second { color: blue; }');
    const original = Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet');
    const nativeStyleSheet = class {};
    Object.defineProperty(globalThis, 'CSSStyleSheet', {
        configurable: true,
        enumerable: false,
        writable: false,
        value: nativeStyleSheet,
    });
    const expected = Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet');
    t.after(() => {
        if (original) Object.defineProperty(globalThis, 'CSSStyleSheet', original);
        else delete globalThis.CSSStyleSheet;
    });

    await Promise.all([buildShadowStyles(first), buildShadowStyles(second)]);
    assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet'), expected);
});

test('should reject an import immediately after a CSS comment', async (t) => {
    const dir = temporaryDirectory(t);
    writeFileSync(join(dir, 'styles.css'), '/* comment */@import "missing.css";');
    await assert.rejects(buildShadowStyles(dir), /@import/);
});

test('should allow CSS comments that only mention imports', async (t) => {
    const dir = temporaryDirectory(t);
    writeFileSync(join(dir, 'styles.css'), '/* @import "example.css"; */.test { color: red; }');
    const original = Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet');
    delete globalThis.CSSStyleSheet;
    t.after(() => {
        if (original) Object.defineProperty(globalThis, 'CSSStyleSheet', original);
        else delete globalThis.CSSStyleSheet;
    });
    await buildShadowStyles(dir);
    assert.equal(Object.hasOwn(globalThis, 'CSSStyleSheet'), false);
});

test('should continue verification after a failed build', async (t) => {
    const first = temporaryDirectory(t);
    const next = temporaryDirectory(t);
    const original = Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet');
    writeFileSync(join(first, 'styles.css'), '.first { color: red; }');
    const pending = buildShadowStyles(first);
    writeFileSync(
        join(first, 'shadow-styles.cjs'),
        "throw new Error('verification fixture failure');",
    );
    await assert.rejects(pending, /verification fixture failure/);
    assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet'), original);

    writeFileSync(join(next, 'styles.css'), '.next { color: green; }');
    await buildShadowStyles(next);
    assert.deepEqual(Object.getOwnPropertyDescriptor(globalThis, 'CSSStyleSheet'), original);
});

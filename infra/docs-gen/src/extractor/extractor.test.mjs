import assert from 'node:assert/strict';
import {test} from 'node:test';

import {extractExtensionNamesFromSource} from './ast/extension-name.mjs';
import {EXTENSION_BLACKLIST, INTERNAL_EXTENSION_BLACKLIST} from './blacklist.mjs';
import {filterExtensionRefs} from './entry-points.mjs';
import {createExtensionRecord, EXTENSION_FIELD_CONFIG} from './field-config.mjs';

function createSourceFile(content) {
    return {path: 'extension.ts', content};
}

test('extractExtensionNamesFromSource reads exported extension const names from TypeScript AST', () => {
    const content = [
        "import type {ExtensionAuto} from '../../../core';",
        'const InternalExtension: ExtensionAuto = (builder) => {',
        '    builder.addAction("internal", () => null);',
        '};',
        'export const PublicExtension = Object.assign(InternalExtension, {});',
        'export const DirectExtension: ExtensionAuto = (builder) => {',
        '    builder.addAction("direct", () => null);',
        '};',
        'export const NotAnExtension = "value";',
    ].join('\n');

    assert.deepEqual(extractExtensionNamesFromSource(content), [
        'PublicExtension',
        'DirectExtension',
    ]);
});

test('filterExtensionRefs removes internal and public blacklist entries', () => {
    assert.deepEqual(
        filterExtensionRefs([
            {name: 'Bold'},
            {name: 'BaseKeymap'},
            {name: 'YfmCut'},
            {name: 'Italic'},
        ]).map((extensionRef) => extensionRef.name),
        ['Bold', 'Italic'],
    );
    assert.equal(INTERNAL_EXTENSION_BLACKLIST.includes('BaseKeymap'), true);
    assert.equal(EXTENSION_BLACKLIST.includes('YfmCut'), true);
});

test('createExtensionRecord extracts only configured fields', () => {
    const content = 'export const Bold: ExtensionAuto = (builder) => builder;';
    const record = createExtensionRecord({
        extensionRef: {name: 'Bold'},
        sourceFiles: [createSourceFile(content)],
    });

    assert.deepEqual(Object.keys(EXTENSION_FIELD_CONFIG), ['name']);
    assert.deepEqual(record, {name: 'Bold'});
});

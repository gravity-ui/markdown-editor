import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EXTENSION_NAME_BLACKLIST,
    extractExtensionNamesFromSource,
    filterExtensionNames,
} from './extract-extension-names.mjs';

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

test('filterExtensionNames removes blacklisted extension names', () => {
    assert.deepEqual(filterExtensionNames(['Bold', 'BaseKeymap', 'YfmCut', 'Italic']), [
        'Bold',
        'Italic',
    ]);
    assert.equal(EXTENSION_NAME_BLACKLIST.includes('YfmCut'), true);
});

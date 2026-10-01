import assert from 'node:assert/strict';
import {test} from 'node:test';

import {extractExtensionNamesFromSource} from './extension-ast.mjs';

test('should read exported constants annotated with an extension type', () => {
    assert.deepEqual(
        extractExtensionNamesFromSource(
            [
                'export const Bold: ExtensionAuto<BoldOptions> = () => {};',
                'export const BoldSpecs = () => {};',
                'export type BoldOptions = {};',
                "export {boldMarkName} from './BoldSpecs';",
            ].join('\n'),
        ),
        ['Bold'],
    );
});

test('should skip constants that are not exported', () => {
    assert.deepEqual(extractExtensionNamesFromSource('const Bold: ExtensionAuto = () => {};'), []);
});

test('should read a qualified extension type', () => {
    assert.deepEqual(
        extractExtensionNamesFromSource('export const Bold: core.ExtensionAuto = () => {};'),
        ['Bold'],
    );
});

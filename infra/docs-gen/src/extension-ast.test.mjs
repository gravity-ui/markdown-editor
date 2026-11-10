import {expect, it} from 'vitest';

import {extractExtensionNamesFromSource} from './extension-ast.mjs';

it('should read exported constants annotated with an extension type', () => {
    expect(
        extractExtensionNamesFromSource(
            [
                'export const Bold: ExtensionAuto<BoldOptions> = () => {};',
                'export const BoldSpecs = () => {};',
                'export type BoldOptions = {};',
                "export {boldMarkName} from './BoldSpecs';",
            ].join('\n'),
        ),
    ).toEqual(['Bold']);
});

it('should skip constants that are not exported', () => {
    expect(extractExtensionNamesFromSource('const Bold: ExtensionAuto = () => {};')).toEqual([]);
});

it('should read a qualified extension type', () => {
    expect(
        extractExtensionNamesFromSource('export const Bold: core.ExtensionAuto = () => {};'),
    ).toEqual(['Bold']);
});

/**
 * English: Unit coverage for constant extraction and reference resolution.
 *
 * Русский: Unit-покрытие извлечения констант и резолва ссылок.
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';

import {extractConstants, resolveAllConstants} from './constants.mjs';

test('extractConstants captures top-level scalar object props with nested objects', () => {
    const content = [
        'export const CLASSNAMES = {',
        "    Inline: { Container: 'a', Sharp: 'b' },",
        "    Block: 'mathblock',",
        "    Display: 'display',",
        '} as const;',
    ].join('\n');

    const map = extractConstants(content);

    assert.equal(map.get('CLASSNAMES.Block'), 'mathblock');
    assert.equal(map.get('CLASSNAMES.Display'), 'display');
});

test('extractConstants handles enums after objects with nested braces', () => {
    const content = [
        'const NESTED = { Inner: { Foo: "bar" }, Outer: "value" };',
        'export enum NodeName { Para = "paragraph", Doc = "doc" }',
    ].join('\n');

    const map = extractConstants(content);

    assert.equal(map.get('NESTED.Outer'), 'value');
    assert.equal(map.get('NodeName.Para'), 'paragraph');
    assert.equal(map.get('NodeName.Doc'), 'doc');
});

test('extractConstants resolves identifier-valued props through reference chains', () => {
    const content = ["const NAME = 'bold';", 'export const Specs = { Bold: NAME };'].join('\n');

    const map = extractConstants(content);

    assert.equal(map.get('Specs.Bold'), 'bold');
});

test('resolveAllConstants expands a prefix into all known members', () => {
    const content = 'enum NodeName { Para = "paragraph", Doc = "doc" }';
    const map = extractConstants(content);

    assert.deepEqual(resolveAllConstants(['NodeName'], map).sort(), ['doc', 'paragraph']);
});

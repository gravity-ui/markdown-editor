import type {LeafBlockDirectiveParams} from '@diplodoc/directive';
import {describe, expect, it} from 'vitest';

import {parseDirectiveAttrs, stringifyAttrs} from './attrs';
import {isHeaderHeight} from './dimensions';

const schema = {height: isHeaderHeight, name: (value: string) => value.length > 0};

describe('Directive attributes', () => {
    it.each([
        [{}, {}],
        [{attrs: {}}, {}],
        [{attrs: {height: 'm'}}, {height: 'm'}],
        [{attrs: {height: 'l', name: 'a"b'}}, {height: 'l', name: 'a"b'}],
    ])('should accept known attributes %j', (params, attrs) => {
        expect(parseDirectiveAttrs({startLine: 0, endLine: 2, ...params}, schema)).toEqual(attrs);
    });

    it.each<Partial<LeafBlockDirectiveParams>>([
        {attrs: {height: 'xl'}},
        {attrs: {width: 's'}},
        {attrs: {constructor: 'x'}},
        {attrs: {height: ['s', 'm']} as unknown as Record<string, string>},
        {attrs: {name: ''}},
        {contentTitle: {raw: 'text', startPos: 0, endPos: 4}},
        {inlineContent: {raw: '', startPos: 0, endPos: 0}},
        {dests: {link: '/page', _original_dests: [['link', '/page']]}},
    ])('should reject %j', (params) => {
        expect(parseDirectiveAttrs({startLine: 0, endLine: 2, ...params}, schema)).toBeUndefined();
    });

    it('should not change the input', () => {
        const attrs = {height: 'm'};
        const result = parseDirectiveAttrs({startLine: 0, endLine: 2, attrs}, schema);
        expect(result).not.toBe(attrs);
        expect(attrs).toEqual({height: 'm'});
    });

    it.each([
        [{}, {}, ''],
        [{height: 's', width: 'm'}, {}, '{height="s" width="m"}'],
        [{height: 's', width: 'm'}, {height: 's'}, '{width="m"}'],
        [{height: 's'}, {height: 's'}, ''],
        [{name: undefined, alt: 'a "quoted" \\ text'}, {}, '{alt="a \\"quoted\\" \\\\ text"}'],
    ])('should stringify %j without defaults %j', (attrs, defaults, expected) => {
        expect(stringifyAttrs(attrs, defaults)).toBe(expected);
    });
});

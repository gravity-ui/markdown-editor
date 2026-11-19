import {describe, expect, it} from 'vitest';

import {changedAttrs} from './attrs';

describe('changedAttrs', () => {
    it('should return only the passed pairs with a changed value', () => {
        expect(changedAttrs({a: '1', b: null, c: true}, {a: '1', b: '2', c: false})).toEqual([
            ['b', '2'],
            ['c', false],
        ]);
    });

    it('should return a pair missing from the previous values', () => {
        expect(changedAttrs({a: '1'}, {a: '1', b: null})).toEqual([['b', null]]);
    });

    it('should ignore previous values that are not passed', () => {
        expect(changedAttrs({a: '1', b: '2'}, {a: '1'})).toEqual([]);
    });
});

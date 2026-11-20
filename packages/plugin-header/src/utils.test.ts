import {describe, expect, it} from 'vitest';

import {valuesOtherThan} from './utils';

type Model = {size: number; color: string; blur: boolean; src: string | null};

const defaults: Model = {size: 2, color: 'auto', blur: false, src: null};

describe('valuesOtherThan', () => {
    it('should write the values other than the defaults as strings in the order of the defaults', () => {
        const model: Model = {blur: true, src: '/a.png', color: 'auto', size: 1};
        const values = valuesOtherThan(model, defaults);
        expect(values).toEqual({size: '1', blur: 'true', src: '/a.png'});
        expect(Object.keys(values)).toEqual(['size', 'blur', 'src']);
    });

    it('should skip null values', () => {
        expect(
            valuesOtherThan<Model>({...defaults, src: null}, {...defaults, src: '/a.png'}),
        ).toEqual({});
    });
});

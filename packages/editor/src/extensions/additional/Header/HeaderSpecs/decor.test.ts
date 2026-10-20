import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {getHeaderShapes} from './decor';

const shapes = (attrs: Record<string, unknown>) => getHeaderShapes(normalizeHeaderAttrs(attrs));

describe('header shapes', () => {
    it.each(['none', 'darken', 'lighten', 'blur', 'gradient', 'pattern'])(
        'should omit shapes for decor="%s"',
        (decor) => {
            expect(shapes({decor})).toHaveLength(0);
        },
    );

    it('should omit shapes by default', () => {
        expect(shapes({fill: 'blue'})).toHaveLength(0);
    });

    it('should apply a named layout', () => {
        expect(shapes({decor: 'shapes', shape: 'corner'})).toHaveLength(1);
        expect(shapes({decor: 'shapes', shape: 'scatter'})).toHaveLength(3);
        expect(shapes({decor: 'shapes', shape: 'edges'})).not.toEqual(
            shapes({decor: 'shapes', shape: 'bottom'}),
        );
    });

    it('should color mesh spots with both fills in turn', () => {
        expect(shapes({decor: 'mesh', shape: 'scatter'}).map(({tone}) => tone)).toEqual([
            'fill2',
            'fill',
            'fill2',
        ]);
        expect(shapes({decor: 'shapes'}).every(({tone}) => tone === undefined)).toBe(true);
    });
});

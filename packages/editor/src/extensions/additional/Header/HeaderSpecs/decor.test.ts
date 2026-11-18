import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {getHeaderShapes} from './decor';

const shapes = (attrs: Record<string, unknown>) => getHeaderShapes(normalizeHeaderAttrs(attrs));

describe('header shapes', () => {
    it('should omit shapes for a plain fill', () => {
        expect(shapes({bg: 'fill'})).toHaveLength(0);
    });

    it('should apply a named layout', () => {
        expect(shapes({shapes: 'corner'})).toHaveLength(1);
        expect(shapes({shapes: 'scatter'})).toHaveLength(3);
        expect(shapes({shapes: 'edges'})).not.toEqual(shapes({shapes: 'bottom'}));
    });

    it('should use the second color for the first mesh shape', () => {
        expect(shapes({bg: 'mesh', fill2: 'sand', shapes: 'scatter'})[0].fill).toBe('sand');
    });
});

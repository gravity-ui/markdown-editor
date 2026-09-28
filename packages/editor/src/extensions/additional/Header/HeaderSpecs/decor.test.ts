import {describe, expect, it} from 'vitest';

import {normalizeHeaderAttrs} from './attrs';
import {getHeaderShapes} from './decor';

const attrs = (patch: Record<string, unknown>) => normalizeHeaderAttrs(patch);

describe('header shapes', () => {
    it('should give no shapes without decor', () => {
        expect(getHeaderShapes(attrs({decor: 'none'}))).toHaveLength(0);
    });

    it('should give no shapes over an image', () => {
        expect(getHeaderShapes(attrs({bg: 'image'}))).toHaveLength(0);
    });

    it('should repeat the same layout for the same seed', () => {
        expect(getHeaderShapes(attrs({seed: 481203}))).toEqual(
            getHeaderShapes(attrs({seed: 481203})),
        );
    });

    it('should give different layouts for different seeds', () => {
        expect(getHeaderShapes(attrs({seed: 1}))).not.toEqual(getHeaderShapes(attrs({seed: 2})));
    });

    it('should colour mesh shapes and leave fill shapes plain', () => {
        const mesh = getHeaderShapes(attrs({bg: 'mesh', seed: 7}));
        const decor = getHeaderShapes(attrs({seed: 7}));

        expect(mesh.every((shape) => Boolean(shape.fill))).toBe(true);
        expect(decor.every((shape) => shape.fill === undefined)).toBe(true);
    });

    it('should take the curated layout from the design for the zero seed', () => {
        expect(getHeaderShapes(attrs({}))).toHaveLength(2);
        expect(getHeaderShapes(attrs({bg: 'mesh'}))).toHaveLength(3);
    });
});

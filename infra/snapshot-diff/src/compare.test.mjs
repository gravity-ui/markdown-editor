import {Buffer} from 'node:buffer';

import sharp from 'sharp';
import {describe, expect, it} from 'vitest';

import {compareImages} from './compare.mjs';

const image = (width, height, background) =>
    sharp({create: {width, height, channels: 4, background}})
        .webp({lossless: true})
        .toBuffer();

describe('compareImages', () => {
    it('should compare WebP screenshots and highlight changed pixels', async () => {
        const result = await compareImages(await image(4, 3, 'white'), await image(4, 3, 'black'));
        expect(result.changedPixels).toBe(12);
        expect(result.beforeSize).toBe('4 × 3');
        const data = await sharp(result.images.diff).ensureAlpha().raw().toBuffer();
        expect([...data.subarray(0, 4)]).toEqual([255, 0, 80, 255]);
    });

    it('should show zero changed pixels for identical screenshots', async () => {
        const input = await image(4, 3, 'white');
        const result = await compareImages(input, input);
        expect(result.changedPixels).toBe(0);
        expect(result.images.diff).toBeInstanceOf(Buffer);
    });

    it.each([
        [4, 3, 4, 5],
        [4, 5, 4, 3],
        [4, 3, 6, 3],
        [4, 5, 6, 3],
    ])(
        'should highlight blank areas after resizing from %i×%i to %i×%i',
        async (w1, h1, w2, h2) => {
            const result = await compareImages(
                await image(w1, h1, 'white'),
                await image(w2, h2, 'white'),
            );
            const overlap = Math.min(w1, w2) * Math.min(h1, h2);
            expect(result.changedPixels).toBe(w1 * h1 + w2 * h2 - 2 * overlap);
            expect(result.afterSize).toBe(`${w2} × ${h2}`);
        },
    );

    it('should preserve the available version of added and removed screenshots', async () => {
        const input = await image(4, 3, 'white');
        const added = await compareImages(null, input);
        const removed = await compareImages(input, null);
        expect(Object.keys(added.images)).toEqual(['after']);
        expect(Object.keys(removed.images)).toEqual(['before']);
        expect(added.changedPixels).toBeUndefined();
        expect(removed.changedPixels).toBeUndefined();
    });
});

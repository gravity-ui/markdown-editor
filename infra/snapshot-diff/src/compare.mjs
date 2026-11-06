import {Buffer} from 'node:buffer';

import pixelmatch from 'pixelmatch';
import sharp from 'sharp';

const DIFF_COLOR = [255, 0, 80];

async function decode(input) {
    if (!input) return null;
    return sharp(input)
        .toColourspace('srgb')
        .ensureAlpha()
        .raw()
        .toBuffer({resolveWithObject: true});
}

function pad(image, width, height) {
    const data = Buffer.alloc(width * height * 4, 255);
    for (let y = 0; y < image.info.height; y++) {
        const start = y * image.info.width * 4;
        image.data.copy(data, y * width * 4, start, start + image.info.width * 4);
    }
    return data;
}

function png(data, width, height) {
    return sharp(data, {raw: {width, height, channels: 4}})
        .png()
        .toBuffer();
}

function comparePixels(before, after, width, height) {
    const data = Buffer.alloc(width * height * 4);
    let changedPixels = pixelmatch(
        pad(before, width, height),
        pad(after, width, height),
        data,
        width,
        height,
        {
            threshold: 0.1,
            diffColor: DIFF_COLOR,
        },
    );

    // White padding still represents added or removed pixels.
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const inBefore = x < before.info.width && y < before.info.height;
            const inAfter = x < after.info.width && y < after.info.height;
            if (inBefore === inAfter) continue;
            const offset = (y * width + x) * 4;
            if (!DIFF_COLOR.every((value, channel) => data[offset + channel] === value)) {
                changedPixels++;
            }
            data.set([...DIFF_COLOR, 255], offset);
        }
    }
    return {data, changedPixels};
}

export async function compareImages(beforeInput, afterInput) {
    const [before, after] = await Promise.all([decode(beforeInput), decode(afterInput)]);
    const width = Math.max(before?.info.width ?? 0, after?.info.width ?? 0);
    const height = Math.max(before?.info.height ?? 0, after?.info.height ?? 0);
    const comparison = before && after ? comparePixels(before, after, width, height) : null;

    const images = {};
    for (const [name, image] of Object.entries({before, after})) {
        if (image) {
            images[name] = await png(image.data, image.info.width, image.info.height);
        }
    }
    if (comparison) images.diff = await png(comparison.data, width, height);

    return {
        images,
        changedPixels: comparison?.changedPixels,
        width,
        height,
        beforeSize: before ? `${before.info.width} × ${before.info.height}` : null,
        afterSize: after ? `${after.info.width} × ${after.info.height}` : null,
    };
}

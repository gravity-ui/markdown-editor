import type {FilesGallerySource} from '../types';

import {getMediaType, normalizeMimeType} from './media-type';

const dataUriMimeTypeRegex = /^data:([^;,]+)/i;

export function readResource(element: Element): FilesGallerySource | null {
    const isImage = element instanceof HTMLImageElement;
    if (!isImage && element.tagName !== 'A') return null;

    const url = isImage
        ? element.currentSrc || element.getAttribute('src')
        : element.getAttribute('href');
    if (!url) return null;

    // YFM metadata is also read in editor/src/view/hooks/useFilesGallery/helpers.ts.
    const isYfmFile = element.classList.contains('yfm-file');
    const linkNameAttribute = isYfmFile ? 'download' : 'title';
    const name = element.getAttribute(isImage ? 'alt' : linkNameAttribute);
    const mimeType =
        normalizeMimeType(isYfmFile ? element.getAttribute('type') : undefined) ||
        normalizeMimeType(url.trimStart().match(dataUriMimeTypeRegex)?.[1]);

    return {
        url,
        type: isImage ? 'image' : getMediaType({url, mimeType, baseURI: element.baseURI}),
        element,
        name: name ?? undefined,
        mimeType,
    };
}

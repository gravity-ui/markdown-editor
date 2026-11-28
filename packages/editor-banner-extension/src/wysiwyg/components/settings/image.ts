import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import {getConfig} from '@gravity-ui/markdown-editor/_/configure.js';
import {type LinkParser, normalizeLinkUrl} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../i18n';

export type BannerUploadLimits = {
    /** MIME types of the files the image forms upload; any image type by default. */
    imageTypes?: readonly string[];
    /** The largest file size in bytes; no limit by default. */
    maxImageSize?: number;
};

export function imageName(url: string) {
    const name = url.split(/[?#]/)[0].split('/').pop() || url;
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

function formatImageSize(bytes: number) {
    if (bytes < 1024) return i18n('file-size-bytes', {size: bytes});
    const kilobytes = bytes < 1024 ** 2;
    const size = new Intl.NumberFormat(getConfig().lang ?? 'en', {maximumFractionDigits: 1}).format(
        bytes / (kilobytes ? 1024 : 1024 ** 2),
    );
    return i18n(kilobytes ? 'file-size-kb' : 'file-size-mb', {size});
}

const imageFormat = (type: string) =>
    type
        .slice(type.indexOf('/') + 1)
        .split('+')[0]
        .toUpperCase();

export function uploadHint({imageTypes, maxImageSize}: BannerUploadLimits) {
    const formats = imageTypes?.map(imageFormat) ?? [];
    const last = formats.pop();
    const types = formats.length ? i18n('list-or', {items: formats.join(', '), last}) : last;
    const size = maxImageSize === undefined ? undefined : formatImageSize(maxImageSize);
    if (types && size !== undefined) return i18n('upload-hint', {types, size});
    if (types) return i18n('upload-hint-types', {types});
    if (size !== undefined) return i18n('upload-hint-size', {size});
    return i18n('upload-hint-image');
}

export function imageFileError(file: File, {imageTypes, maxImageSize}: BannerUploadLimits) {
    if (imageTypes ? !imageTypes.includes(file.type) : !file.type.startsWith('image/')) {
        return i18n('upload-error-type');
    }
    if (maxImageSize !== undefined && file.size > maxImageSize) {
        return i18n('upload-error-size', {size: formatImageSize(maxImageSize)});
    }
    return null;
}

/** Uploads an image file and resolves to its address; an unsafe address rejects. */
export const imageUploader =
    (fileUploadHandler: FileUploadHandler, parser: LinkParser) => async (file: File) => {
        const {url} = await fileUploadHandler(file);
        const image = normalizeLinkUrl(parser, url);
        if (!image) throw new Error(`Unsupported image address: ${url}`);
        return image;
    };

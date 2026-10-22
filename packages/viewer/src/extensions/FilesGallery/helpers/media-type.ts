// Format lists are copied from packages/editor/src/view/hooks/useFilesGallery/constants.ts.
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'];
const videoExtensions = ['mp4', 'webm', 'ogg'];
const imageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/x-png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'image/bmp',
    'image/x-ms-bmp',
];
const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];

export function getMediaType({
    url,
    mimeType,
    baseURI,
}: {
    url: string;
    mimeType?: string;
    baseURI: string;
}): 'image' | 'video' | 'file' {
    if (mimeType && imageMimeTypes.includes(mimeType)) return 'image';
    if (
        mimeType &&
        (videoMimeTypes.includes(mimeType) || (mimeType === 'video/quicktime' && isMac()))
    ) {
        return 'video';
    }
    if (/^data:/i.test(url.trimStart())) return 'file';

    let pathname: string;
    try {
        pathname = new URL(url, baseURI).pathname;
    } catch {
        return 'file';
    }

    const extension = pathname
        .split('/')
        .pop()
        ?.match(/\.([^.]+)$/)?.[1]
        .toLowerCase();
    if (!extension) return 'file';
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension) || (extension === 'mov' && isMac())) return 'video';
    return 'file';
}

export function normalizeMimeType(value: string | null | undefined): string | undefined {
    return value?.split(';', 1)[0].trim().toLowerCase() || undefined;
}

function isMac(): boolean {
    return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
}

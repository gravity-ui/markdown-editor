export const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'];

const commonVideoExtensions = ['mp4', 'webm', 'ogg'];
const platformVideoExtensions =
    typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? ['mov'] : [];

export const supportedVideoExtensions = [...commonVideoExtensions, ...platformVideoExtensions];

export const supportedExtensions = [...supportedImageExtensions, ...supportedVideoExtensions];

export const extensionRegex = /\w+?$/;

export const YfmFileClassname = 'yfm-file';
export const YfmFileAttrs = {
    Download: 'download',
    Type: 'type',
} as const;

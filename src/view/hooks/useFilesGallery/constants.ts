export const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'];

export const supportedVideoExtensions = ['mp4', 'webm', 'ogg'];

export const supportedExtensions = [...supportedImageExtensions, ...supportedVideoExtensions];

export const extensionRegex = /\w+?$/;

export const YfmFileClassname = 'yfm-file';
export const YfmFileAttrs = {
    Download: 'download',
    Type: 'type',
} as const;

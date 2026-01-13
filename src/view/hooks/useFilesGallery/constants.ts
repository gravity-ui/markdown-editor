import {isMac} from 'src/utils';

export const supportedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'];

const commonVideoExtensions = ['mp4', 'webm', 'ogg'];
const platformVideoExtensions = isMac() ? ['mov'] : [];

export const supportedVideoExtensions = [...commonVideoExtensions, ...platformVideoExtensions];

export const supportedExtensions = [...supportedImageExtensions, ...supportedVideoExtensions];

export const extensionRegex = /\w+?$/;

export const YfmFileClassname = 'yfm-file';
export const YfmFileAttrs = {
    Download: 'download',
    Type: 'type',
} as const;

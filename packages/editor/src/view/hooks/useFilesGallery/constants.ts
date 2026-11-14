import {isMac} from 'src/utils/platform';

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

export const FilesGalleryAttrs = {
    /**
     * Opts a subtree of the content out of the gallery: an image or a link inside an element
     * with this attribute is not collected, and a click on it keeps its normal behavior.
     */
    Exclude: 'data-files-gallery-exclude',
} as const;

import type {BannerOptions} from '@gravity-ui/markdown-editor-banner-extension';

export const bannerUploadLimits = {
    imageTypes: ['image/jpeg', 'image/gif', 'image/png'],
    maxImageSize: 2 * 1024 * 1024,
} satisfies BannerOptions;

export const UPLOADED_IMAGE = '/assets/banner-forest-lake.jpg';

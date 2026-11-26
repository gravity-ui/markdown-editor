export const bannerSanitizeAllowedAttributes = {
    div: ['aria-level'],
} as const;

export const filesGalleryExcludeAttrs: Readonly<Record<string, string>> = {
    'data-files-gallery-exclude': 'true',
};

/**
 * The opt-out contract of the files galleries: `FILES_GALLERY_EXCLUDE_ATTRIBUTE` of
 * `@gravity-ui/markdown-viewer/extensions` and `FilesGalleryAttrs.Exclude` of
 * `@gravity-ui/markdown-editor/view`. A gallery skips the images and the links inside
 * an element with this attribute and leaves the clicks on them alone. The name is kept
 * here: the plugin does not depend on the gallery packages.
 */
export const filesGalleryExcludeAttrs: Readonly<Record<string, string>> = {
    'data-files-gallery-exclude': 'true',
};

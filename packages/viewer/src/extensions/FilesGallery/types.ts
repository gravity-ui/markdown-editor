import type {GalleryItemProps} from '@gravity-ui/components';

export type FilesGalleryItemType = 'image' | 'video' | 'file';

export interface FilesGallerySource {
    /** The image currentSrc or src, or the link href. */
    readonly url: string;
    /** The detected resource type. An img always has type image. */
    readonly type: FilesGalleryItemType;
    /** The HTML image or link. Do not keep it in returned items or actions. */
    readonly element: Element;
    /** Image alt, YFM file download name, or link title; absent when not set. */
    readonly name?: string;
    /** Normalized MIME type from YFM metadata or a data URL, when available. */
    readonly mimeType?: string;
}

/**
 * Items are built on each opening attempt, not while rendering HTML.
 * The target is built first. If it is skipped, other resources are not collected.
 * Item callbacks run once per collected resource. Do not change the HTML in them.
 */
export interface FilesGalleryProps {
    /** Ready items placed before HTML items. Item callbacks do not change them. Default: none. */
    additionalItems?: readonly GalleryItemProps[];
    /** Return the download action URL, or undefined to omit it. Default: no download action. */
    getDownloadUrl?: (source: FilesGallerySource) => string | undefined;
    /** Return the copy action URL, or undefined to omit it. Default: no copy action. */
    getCopyUrl?: (source: FilesGallerySource) => string | undefined;
    /** Called after a successful copy, even if the copy control has unmounted. Default: no callback. */
    onLinkCopied?: (url: string) => void;
    /**
     * Replace the whole item after copy/download actions are added, or return null to skip it.
     * This does not remove image keyboard attributes. Default: keep the built item.
     */
    transformItem?: (
        item: Readonly<GalleryItemProps>,
        source: FilesGallerySource,
    ) => GalleryItemProps | null;
    /**
     * Build an item for type file, or return undefined to skip it. Default: skip custom files.
     * Copy/download actions and transformItem are applied after this callback.
     */
    resolveCustomItem?: (
        source: FilesGallerySource & {readonly type: 'file'},
    ) => GalleryItemProps | undefined;
}

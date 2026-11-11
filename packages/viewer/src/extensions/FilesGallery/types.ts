import type {GalleryItemProps} from '@gravity-ui/components';

export type FilesGalleryItemType = 'image' | 'video' | 'file';

export interface FilesGallerySource {
    readonly url: string;
    readonly type: FilesGalleryItemType;
    readonly element: Element;
    readonly name?: string;
    readonly mimeType?: string;
}

export interface FilesGalleryProps {
    additionalItems?: readonly GalleryItemProps[];
    getDownloadUrl?: (source: FilesGallerySource) => string | undefined;
    getCopyUrl?: (source: FilesGallerySource) => string | undefined;
    onLinkCopied?: (url: string) => void;
    transformItem?: (
        item: Readonly<GalleryItemProps>,
        source: FilesGallerySource,
    ) => GalleryItemProps | null;
    resolveCustomItem?: (
        source: FilesGallerySource & {readonly type: 'file'},
    ) => GalleryItemProps | undefined;
}

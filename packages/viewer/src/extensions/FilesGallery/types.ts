import type {GalleryItemProps} from '@gravity-ui/components';

export type GalleryItemPropsWithUrl = GalleryItemProps & {url?: string};

export type FilesGalleryItemType = 'image' | 'video' | 'file';

export interface FilesGalleryProps {
    customFiles?: GalleryItemPropsWithUrl[];
    download?: (url: string, type: FilesGalleryItemType, element: Element) => string | undefined;
    copyUrl?: (url: string, type: FilesGalleryItemType, element: Element) => string | undefined;
    overrideItemProps?: (
        url: string,
        type: FilesGalleryItemType,
        element: Element,
        currentProps: GalleryItemProps,
    ) => GalleryItemProps;
    resolveCustomItem?: (
        url: string,
        type: 'file',
        element: Element,
        linkObj: {name?: string | null; mimetype?: string | null},
    ) => GalleryItemProps | undefined;
}

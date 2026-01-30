import type {GalleryItemProps} from '@gravity-ui/components';

export type GalleryItemPropsWithUrl = GalleryItemProps & {
    // pass the url to be able to exclude the items from content if they are found in the custom files
    url?: string;
};

export type FilesGalleryItemType = 'image' | 'video';

export type UseFilesGalleryOptions = {
    download?: (url: string, type: FilesGalleryItemType, element: Element) => string | undefined;
    copyUrl?: (url: string, type: FilesGalleryItemType, element: Element) => string | undefined;
    overrideItemProps?: (
        url: string,
        type: FilesGalleryItemType,
        element: Element,
        currentProps: GalleryItemProps,
    ) => GalleryItemProps;
};

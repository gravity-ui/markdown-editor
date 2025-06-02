import type {GalleryItemProps} from '@gravity-ui/components';

export type GalleryItemPropsWithUrl = GalleryItemProps & {
    // pass the url to be able to exclude the items from content if they are found in the custom files
    url?: string;
};

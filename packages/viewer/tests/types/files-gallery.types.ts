import {createElement} from 'react';

import {type GalleryItemProps, getGalleryItemImage} from '@gravity-ui/components';
import {expectTypeOf} from 'vitest';

import {
    FilesGallery,
    type FilesGalleryItemType,
    type FilesGalleryProps,
    type GalleryItemPropsWithUrl,
} from '../../src/extensions';

export function shouldAcceptFilesGalleryProps() {
    const props: FilesGalleryProps = {
        customFiles: [
            {url: 'image.png', ...getGalleryItemImage({src: 'image.png', name: 'Image'})},
        ],
        copyUrl: (url, type, element) => {
            expectTypeOf(type).toEqualTypeOf<FilesGalleryItemType>();
            expectTypeOf(element).toEqualTypeOf<Element>();
            return url;
        },
        download: (url) => url,
        overrideItemProps: (_url, _type, _element, currentProps) => {
            expectTypeOf(currentProps).toEqualTypeOf<GalleryItemProps>();
            return currentProps;
        },
        resolveCustomItem: (_url, type, _element, file) => {
            expectTypeOf(type).toEqualTypeOf<'file'>();
            expectTypeOf(file).toEqualTypeOf<{name?: string | null; mimetype?: string | null}>();
            return undefined;
        },
    };

    return createElement(FilesGallery, props);
}

expectTypeOf<FilesGalleryItemType>().toEqualTypeOf<'image' | 'video' | 'file'>();
expectTypeOf<FilesGalleryProps['customFiles']>().toEqualTypeOf<
    GalleryItemPropsWithUrl[] | undefined
>();
expectTypeOf<NonNullable<FilesGalleryProps['resolveCustomItem']>>().returns.toEqualTypeOf<
    GalleryItemProps | undefined
>();

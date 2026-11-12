import {createElement} from 'react';

import {type GalleryItemProps, getGalleryItemImage} from '@gravity-ui/components';
import {expectTypeOf} from 'vitest';

import {
    FilesGallery,
    type FilesGalleryItemType,
    type FilesGalleryProps,
    type FilesGallerySource,
} from '../../src/extensions';

export function shouldAcceptFilesGalleryProps() {
    const additionalItems: readonly GalleryItemProps[] = [
        getGalleryItemImage({src: 'image.png', name: 'Image'}),
    ];
    const props: FilesGalleryProps = {
        additionalItems,
        getCopyUrl: (source) => {
            expectTypeOf(source).toEqualTypeOf<FilesGallerySource>();
            const input = source;
            // @ts-expect-error Sources are read-only.
            input.url = '/other.png';
            return source.url;
        },
        getDownloadUrl: (source) => {
            expectTypeOf(source).toEqualTypeOf<FilesGallerySource>();
            return source.url;
        },
        transformItem: (item, source) => {
            expectTypeOf(item).toEqualTypeOf<Readonly<GalleryItemProps>>();
            expectTypeOf(source).toEqualTypeOf<FilesGallerySource>();
            const input = item;
            // @ts-expect-error Transform inputs are read-only.
            input.name = 'Other';
            return source.name ? {...item, name: source.name} : null;
        },
        resolveCustomItem: (source) => {
            expectTypeOf(source).toEqualTypeOf<FilesGallerySource & {readonly type: 'file'}>();
            const input = source;
            // @ts-expect-error Narrowed sources are read-only too.
            input.type = 'file';
            return undefined;
        },
        onLinkCopied: (url) => {
            expectTypeOf(url).toEqualTypeOf<string>();
        },
    };

    return createElement(FilesGallery, props);
}

expectTypeOf<FilesGalleryItemType>().toEqualTypeOf<'image' | 'video' | 'file'>();
expectTypeOf<FilesGallerySource>().toEqualTypeOf<{
    readonly url: string;
    readonly type: FilesGalleryItemType;
    readonly element: Element;
    readonly name?: string;
    readonly mimeType?: string;
}>();
expectTypeOf<FilesGalleryProps['additionalItems']>().toEqualTypeOf<
    readonly GalleryItemProps[] | undefined
>();
expectTypeOf<NonNullable<FilesGalleryProps['resolveCustomItem']>>().returns.toEqualTypeOf<
    GalleryItemProps | undefined
>();
expectTypeOf<
    NonNullable<FilesGalleryProps['transformItem']>
>().returns.toEqualTypeOf<GalleryItemProps | null>();

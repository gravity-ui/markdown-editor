import {type GalleryItemProps, GalleryProvider, getGalleryItemImage} from '@gravity-ui/components';
import {expectTypeOf} from 'vitest';

import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {
    FilesGallery,
    type FilesGalleryItemType,
    type FilesGalleryProps,
    type FilesGallerySource,
    YfmCodeBlockActions,
    type YfmCodeBlockActionsProps,
} from '@gravity-ui/markdown-viewer/extensions';

export function Consumer() {
    const additionalItems: readonly GalleryItemProps[] = [
        getGalleryItemImage({src: 'image.png', name: 'Image'}),
    ];

    return (
        <GalleryProvider>
            <MarkdownViewer html="">
                <YfmCodeBlockActions
                    copyButton
                    lineWrappingButton
                    codeBlockSelector=".code-container"
                    getCodeBlockText={(element) => element.dataset.code || ''}
                />
                <FilesGallery
                    additionalItems={additionalItems}
                    getCopyUrl={(source) => {
                        expectTypeOf(source).toEqualTypeOf<FilesGallerySource>();
                        const input = source;
                        // @ts-expect-error Sources are read-only.
                        input.url = '/other.png';
                        return source.url;
                    }}
                    getDownloadUrl={(source) => {
                        expectTypeOf(source).toEqualTypeOf<FilesGallerySource>();
                        return source.url;
                    }}
                    transformItem={(item, source) => {
                        expectTypeOf(item).toEqualTypeOf<Readonly<GalleryItemProps>>();
                        expectTypeOf(source).toEqualTypeOf<FilesGallerySource>();
                        const input = item;
                        // @ts-expect-error Transform inputs are read-only.
                        input.name = 'Other';
                        return source.name ? {...item, name: source.name} : null;
                    }}
                    resolveCustomItem={(source) => {
                        expectTypeOf(source).toEqualTypeOf<
                            FilesGallerySource & {readonly type: 'file'}
                        >();
                        const input = source;
                        // @ts-expect-error Narrowed sources are read-only too.
                        input.type = 'file';
                        return undefined;
                    }}
                    onLinkCopied={(url) => {
                        expectTypeOf(url).toEqualTypeOf<string>();
                    }}
                />
            </MarkdownViewer>
        </GalleryProvider>
    );
}

expectTypeOf<NonNullable<YfmCodeBlockActionsProps['getCodeBlockText']>>()
    .parameter(0)
    .toEqualTypeOf<HTMLElement>();

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

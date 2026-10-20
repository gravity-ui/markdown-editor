import {type GalleryItemProps, GalleryProvider, getGalleryItemImage} from '@gravity-ui/components';
import {expectTypeOf} from 'vitest';

import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {
    FilesGallery,
    type FilesGalleryItemType,
    type FilesGalleryProps,
    type GalleryItemPropsWithUrl,
    YfmCodeBlockActions,
    type YfmCodeBlockActionsProps,
} from '@gravity-ui/markdown-viewer/extensions';

export function Consumer() {
    const customFiles: GalleryItemPropsWithUrl[] = [
        {url: 'image.png', ...getGalleryItemImage({src: 'image.png', name: 'Image'})},
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
                    customFiles={customFiles}
                    copyUrl={(url, type, element) => {
                        expectTypeOf(type).toEqualTypeOf<FilesGalleryItemType>();
                        expectTypeOf(element).toEqualTypeOf<Element>();
                        return url;
                    }}
                    download={(url) => url}
                    overrideItemProps={(_url, _type, _element, currentProps) => {
                        expectTypeOf(currentProps).toEqualTypeOf<GalleryItemProps>();
                        return currentProps;
                    }}
                    resolveCustomItem={(_url, type, _element, file) => {
                        expectTypeOf(type).toEqualTypeOf<'file'>();
                        expectTypeOf(file).toEqualTypeOf<{
                            name?: string | null;
                            mimetype?: string | null;
                        }>();
                        return undefined;
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
expectTypeOf<FilesGalleryProps['customFiles']>().toEqualTypeOf<
    GalleryItemPropsWithUrl[] | undefined
>();
expectTypeOf<NonNullable<FilesGalleryProps['resolveCustomItem']>>().returns.toEqualTypeOf<
    GalleryItemProps | undefined
>();

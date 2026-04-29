import {useCallback} from 'react';

import {
    type GalleryItemAction,
    getGalleryItemCopyLinkAction,
    getGalleryItemDownloadAction,
    getGalleryItemImage,
    getGalleryItemVideo,
    useGallery,
} from '@gravity-ui/components';
import {useToaster} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/gallery';

import {extensionRegex, supportedExtensions, supportedVideoExtensions} from './constants';
import {buildLinkObject} from './helpers';
import type {FilesGalleryItemType, GalleryItemPropsWithUrl, UseFilesGalleryOptions} from './types';

export function useFilesGallery(
    customFiles?: GalleryItemPropsWithUrl[],
    {
        download: getItemDownloladUrl,
        overrideItemProps,
        copyUrl: getItemCopyUrl,
        resolveCustomItem,
    }: UseFilesGalleryOptions = {},
) {
    const {openGallery} = useGallery();

    const toaster = useToaster();

    return {
        openFilesGallery: useCallback(
            (event: React.MouseEvent<HTMLDivElement>) => {
                if (!(event.target instanceof HTMLElement)) {
                    return false;
                }

                if (event.target.tagName === 'IMG' && event.target.closest('a')) return false;

                // Opening the context menu or opening the link in the new tab
                if (event.ctrlKey || event.metaKey) {
                    return false;
                }

                const buildItem = (
                    link: string,
                    type: FilesGalleryItemType,
                    element: Element,
                    baseProps: GalleryItemPropsWithUrl,
                ): GalleryItemPropsWithUrl => {
                    const galleryItemActions: GalleryItemAction[] = [];

                    const itemCopyUrl = getItemCopyUrl?.(link, type, element);
                    if (itemCopyUrl) {
                        const handleLinkCopied = () => {
                            toaster.add({
                                theme: 'success',
                                name: 'g-md-editor-gallery-copy-link',
                                title: i18n('link_copied'),
                            });
                        };
                        galleryItemActions.push(
                            getGalleryItemCopyLinkAction({
                                copyUrl: itemCopyUrl,
                                onCopy: handleLinkCopied,
                            }),
                        );
                    }

                    const downloadUrl = getItemDownloladUrl?.(link, type, element);
                    if (downloadUrl) {
                        galleryItemActions.push(getGalleryItemDownloadAction({downloadUrl}));
                    }

                    const galleryItemProps: GalleryItemPropsWithUrl = {
                        ...baseProps,
                        url: link,
                        actions: galleryItemActions,
                    };

                    return {
                        ...galleryItemProps,
                        ...overrideItemProps?.(link, type, element, galleryItemProps),
                    };
                };

                const targetFile = buildLinkObject(event.target);

                if (!targetFile || !targetFile.link) return false;

                const filesFromContent = [
                    ...(event.currentTarget?.querySelectorAll('img,a') ?? []),
                ].reduce<GalleryItemPropsWithUrl[]>((result, element) => {
                    const linkObj = buildLinkObject(element);

                    if (linkObj?.link && !customFiles?.some((item) => item.url === linkObj.link)) {
                        const extension =
                            linkObj.mimetype?.match(extensionRegex)?.[0] ||
                            linkObj.link.match(extensionRegex)?.[0] ||
                            '';

                        if (linkObj.type === 'image' || supportedExtensions.includes(extension)) {
                            const link = linkObj.link;
                            const name = linkObj.name || '';
                            const type: FilesGalleryItemType = supportedVideoExtensions.includes(
                                extension,
                            )
                                ? 'video'
                                : 'image';
                            const baseProps: GalleryItemPropsWithUrl = {
                                ...(type === 'video'
                                    ? getGalleryItemVideo({src: link, name})
                                    : getGalleryItemImage({src: link, name})),
                                url: link,
                            };

                            result.push(buildItem(link, type, element, baseProps));
                        } else if (resolveCustomItem) {
                            const link = linkObj.link;
                            const baseProps = resolveCustomItem(link, 'file', element, {
                                name: linkObj.name,
                                mimetype: linkObj.mimetype,
                            });

                            if (baseProps) {
                                result.push(buildItem(link, 'file', element, baseProps));
                            }
                        }
                    }

                    return result;
                }, []);

                const files = [...(customFiles ?? []), ...filesFromContent];

                const initialItemIndex = files.findIndex((item) => item.url === targetFile.link);

                if (initialItemIndex !== -1) {
                    event.preventDefault();
                    openGallery(files, initialItemIndex);
                    return true;
                }

                return false;
            },
            [
                customFiles,
                getItemCopyUrl,
                getItemDownloladUrl,
                overrideItemProps,
                resolveCustomItem,
                toaster,
                openGallery,
            ],
        ),
    };
}

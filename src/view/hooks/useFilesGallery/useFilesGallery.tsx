import * as React from 'react';

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
import type {FilesGalleryItemType, GalleryItemPropsWithUrl, UseFilesGalleryOptions} from './types';

export function useFilesGallery(
    customFiles?: GalleryItemPropsWithUrl[],
    {
        download: getItemDownloladUrl,
        overrideItemProps,
        copyUrl: getItemCopyUrl,
    }: UseFilesGalleryOptions = {},
) {
    const {openGallery} = useGallery();

    const toaster = useToaster();

    return {
        openFilesGallery: React.useCallback(
            (event: React.MouseEvent<HTMLDivElement>) => {
                if (!(event.target instanceof HTMLElement)) {
                    return false;
                }

                let fileLink = '';

                if (event.target.tagName === 'IMG' && !event.target.closest('a')) {
                    fileLink = event.target.getAttribute('src') ?? '';
                } else if (event.target.tagName === 'A') {
                    fileLink = event.target.getAttribute('href') ?? '';
                }

                if (!fileLink) {
                    return false;
                }

                const filesFromContent = [
                    ...(event.currentTarget?.querySelectorAll('img,a') ?? []),
                ].reduce<GalleryItemPropsWithUrl[]>((result, element) => {
                    const isImage = element.tagName === 'IMG';
                    const link = isImage
                        ? element.getAttribute('src')
                        : element.getAttribute('href');

                    if (link && !customFiles?.some((item) => item.url === link)) {
                        const extension = link.match(extensionRegex)?.[0] || '';

                        if (isImage || supportedExtensions.includes(extension)) {
                            const name =
                                (isImage
                                    ? element.getAttribute('alt')
                                    : element.getAttribute('title')) || '';

                            const filesGalleryItemType: FilesGalleryItemType =
                                supportedVideoExtensions.includes(extension) ? 'video' : 'image';
                            const galleryItemActions: GalleryItemAction[] = [];

                            const itemCopyUrl = getItemCopyUrl?.(
                                link,
                                filesGalleryItemType,
                                element,
                            );

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

                            const downloadUrl = getItemDownloladUrl?.(
                                link,
                                filesGalleryItemType,
                                element,
                            );

                            if (downloadUrl) {
                                galleryItemActions.push(
                                    getGalleryItemDownloadAction({downloadUrl}),
                                );
                            }

                            const galleryItemProps = {
                                ...(filesGalleryItemType === 'video'
                                    ? getGalleryItemVideo({src: link, name: name})
                                    : getGalleryItemImage({src: link, name: name})),
                                url: link,
                                actions: galleryItemActions,
                            };

                            result.push({
                                ...galleryItemProps,
                                ...overrideItemProps?.(
                                    link,
                                    filesGalleryItemType,
                                    element,
                                    galleryItemProps,
                                ),
                            });
                        }
                    }

                    return result;
                }, []);

                const files = [...(customFiles ?? []), ...filesFromContent];

                const initialItemIndex = files.findIndex((item) => item.url === fileLink);

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
                toaster,
                openGallery,
            ],
        ),
    };
}

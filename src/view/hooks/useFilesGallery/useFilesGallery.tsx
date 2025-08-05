import * as React from 'react';

import {
    type GalleryItemAction,
    getGalleryItemImage,
    getGalleryItemVideo,
    useGallery,
} from '@gravity-ui/components';
import {ArrowDownToLine, Link} from '@gravity-ui/icons';
import {ActionTooltip, Button, CopyToClipboard, Icon, useToaster} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/gallery';

import {extensionRegex, supportedExtensions, supportedVideoExtensions} from './constants';
import type {FilesGalleryItemType, GalleryItemPropsWithUrl, UseFilesGalleryOptions} from './types';

export function useFilesGallery(
    customFiles?: GalleryItemPropsWithUrl[],
    {
        download: getItemDownloladUrl,
        overrideItemProps,
        copyLink: getItemCopyLink,
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

                            const itemCopyLink = getItemCopyLink?.(
                                link,
                                filesGalleryItemType,
                                element,
                            );

                            if (itemCopyLink) {
                                const handleLinkCopied = () => {
                                    toaster.add({
                                        theme: 'success',
                                        name: 'g-md-editor-gallery-copy-link',
                                        title: i18n('link_copied'),
                                    });
                                };

                                galleryItemActions.push({
                                    id: 'copy-url',
                                    title: i18n('link_copy'),
                                    icon: <Icon data={Link} />,
                                    render: (props) => (
                                        <CopyToClipboard
                                            text={itemCopyLink}
                                            onCopy={handleLinkCopied}
                                        >
                                            {() => (
                                                <div>
                                                    <ActionTooltip title={i18n('link_copy')}>
                                                        <Button {...props} />
                                                    </ActionTooltip>
                                                </div>
                                            )}
                                        </CopyToClipboard>
                                    ),
                                });
                            }

                            const downloadLink = getItemDownloladUrl?.(
                                link,
                                filesGalleryItemType,
                                element,
                            );

                            if (downloadLink) {
                                const handleDownload = (event?: MouseEvent) => {
                                    event?.stopPropagation();
                                };

                                galleryItemActions.push({
                                    id: 'download',
                                    title: i18n('file_download'),
                                    icon: <Icon data={ArrowDownToLine} />,
                                    href: downloadLink,
                                    onClick: handleDownload,
                                });
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
                getItemCopyLink,
                getItemDownloladUrl,
                overrideItemProps,
                toaster,
                openGallery,
            ],
        ),
    };
}

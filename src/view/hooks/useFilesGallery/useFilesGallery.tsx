import * as React from 'react';

import {getGalleryItemImage, getGalleryItemVideo, useGallery} from '@gravity-ui/components';

import {extensionRegex, supportedExtensions, supportedVideoExtensions} from './constants';
import type {GalleryItemPropsWithUrl} from './types';

export function useFilesGallery(customFiles?: GalleryItemPropsWithUrl[]) {
    const {openGallery} = useGallery();

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

                            result.push({
                                ...(supportedVideoExtensions.includes(extension)
                                    ? getGalleryItemVideo({src: link, name: name})
                                    : getGalleryItemImage({src: link, name: name})),
                                url: link,
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
            [customFiles, openGallery],
        ),
    };
}

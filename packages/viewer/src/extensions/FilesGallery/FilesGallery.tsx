import {useCallback} from 'react';

import {
    type GalleryItemProps,
    getGalleryItemCopyLinkAction,
    getGalleryItemDownloadAction,
    getGalleryItemImage,
    getGalleryItemVideo,
    useGallery,
} from '@gravity-ui/components';
import {useToaster} from '@gravity-ui/uikit';

import {VIEWER_SLOT_ATTRIBUTE} from '../../components/ViewerTargets/constants';
import {useViewerEffect} from '../../hooks/use-viewer-effect';
import {cn} from '../../utils/classname';

import {extensionRegex, supportedExtensions, supportedVideoExtensions} from './constants';
import {buildLinkObject} from './helpers';
import {i18n} from './i18n';
import type {FilesGalleryItemType, FilesGalleryProps, GalleryItemPropsWithUrl} from './types';

import './FilesGallery.scss';

const b = cn('files-gallery');

export function FilesGallery({
    customFiles,
    download,
    copyUrl,
    overrideItemProps,
    resolveCustomItem,
}: FilesGalleryProps) {
    const {openGallery} = useGallery();
    const toaster = useToaster();
    const {t} = i18n.useTranslation();
    const handleLinkCopied = useCallback(() => {
        toaster.add({
            theme: 'success',
            name: 'g-md-viewer-gallery-copy-link',
            title: t('link_copied'),
        });
    }, [toaster, t]);

    useViewerEffect(
        ({root, signal}) => {
            const container = root.parentElement;
            const hadClass = container?.classList.contains(b());
            container?.classList.add(b());

            function handleClick(event: MouseEvent) {
                const clickedElement = event.target;
                if (!(clickedElement instanceof Element)) return;
                if (clickedElement.closest(`[${VIEWER_SLOT_ATTRIBUTE}]`)) return;
                const target = clickedElement.closest('img,a');
                if (!target || !root.contains(target)) return;
                if (target.tagName === 'IMG' && target.closest('a')) return;
                if (event.ctrlKey || event.metaKey) return;

                const targetFile = buildLinkObject(target);
                if (!targetFile?.link) return;

                const files: GalleryItemPropsWithUrl[] = [...(customFiles ?? [])];
                for (const element of Array.from(root.querySelectorAll('img,a'))) {
                    if (element.closest(`[${VIEWER_SLOT_ATTRIBUTE}]`)) continue;
                    const file = buildLinkObject(element);
                    if (!file?.link || customFiles?.some((item) => item.url === file.link))
                        continue;

                    const extension =
                        file.mimetype?.match(extensionRegex)?.[0] ||
                        (/^data:/i.test(file.link) ? '' : file.link.match(extensionRegex)?.[0]) ||
                        '';

                    let type: FilesGalleryItemType;
                    let baseProps: GalleryItemProps | undefined;
                    if (file.type === 'image' || supportedExtensions.includes(extension)) {
                        type = supportedVideoExtensions.includes(extension) ? 'video' : 'image';
                        const props = {src: file.link, name: file.name || ''};
                        baseProps =
                            type === 'video'
                                ? getGalleryItemVideo(props)
                                : getGalleryItemImage(props);
                    } else {
                        type = 'file';
                        baseProps = resolveCustomItem?.(file.link, type, element, {
                            name: file.name,
                            mimetype: file.mimetype,
                        });
                    }
                    if (!baseProps) continue;

                    const actions = [...(baseProps.actions ?? [])];
                    const itemCopyUrl = copyUrl?.(file.link, type, element);
                    if (itemCopyUrl) {
                        actions.push(
                            getGalleryItemCopyLinkAction({
                                copyUrl: itemCopyUrl,
                                onCopy: handleLinkCopied,
                            }),
                        );
                    }
                    const downloadUrl = download?.(file.link, type, element);
                    if (downloadUrl) actions.push(getGalleryItemDownloadAction({downloadUrl}));

                    const props = {...baseProps, url: file.link, actions};
                    files.push({...props, ...overrideItemProps?.(file.link, type, element, props)});
                }

                const initialItemIndex = files.findIndex((item) => item.url === targetFile.link);
                if (initialItemIndex !== -1) {
                    event.preventDefault();
                    openGallery(files, initialItemIndex);
                }
            }

            root.addEventListener('click', handleClick, {signal});
            return () => {
                if (!hadClass) container?.classList.remove(b());
            };
        },
        [
            customFiles,
            download,
            copyUrl,
            overrideItemProps,
            resolveCustomItem,
            openGallery,
            handleLinkCopied,
        ],
    );

    return null;
}

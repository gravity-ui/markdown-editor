import {
    type GalleryItemAction,
    type GalleryItemProps,
    getGalleryItemDownloadAction,
    getGalleryItemImage,
    getGalleryItemVideo,
} from '@gravity-ui/components';
import {ClipboardButton} from '@gravity-ui/uikit';

import type {FilesGalleryProps, FilesGallerySource} from '../types';

export function createGalleryItem(
    source: FilesGallerySource,
    options: FilesGalleryProps,
    copyLinkTitle: string,
): GalleryItemProps | null {
    const mediaProps = {src: source.url, name: source.name || ''};
    let item: GalleryItemProps | undefined;
    switch (source.type) {
        case 'image':
            item = getGalleryItemImage(mediaProps);
            break;
        case 'video':
            item = getGalleryItemVideo(mediaProps);
            break;
        case 'file':
            item = options.resolveCustomItem?.({...source, type: 'file'});
            break;
    }
    if (!item) return null;

    const actions = [...(item.actions ?? [])];
    const copyUrl = options.getCopyUrl?.(source);
    if (copyUrl) actions.push(createCopyLinkAction(copyUrl, copyLinkTitle, options.onLinkCopied));
    const downloadUrl = options.getDownloadUrl?.(source);
    if (downloadUrl) actions.push(getGalleryItemDownloadAction({downloadUrl}));

    const result = {...item, actions};
    return options.transformItem ? options.transformItem(result, source) : result;
}

// TODO: Use getGalleryItemCopyLinkAction after the next @gravity-ui/components major upgrade.
function createCopyLinkAction(
    url: string,
    title: string,
    onLinkCopied: FilesGalleryProps['onLinkCopied'],
): GalleryItemAction {
    return {
        id: 'copy-url',
        title,
        icon: null,
        render: (props) => {
            if (props.href !== undefined) return null;
            return (
                <ClipboardButton
                    {...props}
                    text={url}
                    tooltipInitialText={title}
                    onCopy={(text, success) => {
                        if (success) onLinkCopied?.(text);
                    }}
                />
            );
        },
    };
}

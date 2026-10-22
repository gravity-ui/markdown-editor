import type {GalleryItemProps} from '@gravity-ui/components';

import {VIEWER_SLOT_ATTRIBUTE} from '../../../components/ViewerTargets/constants';
import type {FilesGalleryProps} from '../types';

import {createGalleryItem} from './create-gallery-item';
import {readResource} from './read-resource';

export function collectGallery(
    root: HTMLElement,
    target: Element,
    options: FilesGalleryProps,
    copyLinkTitle: string,
): {items: GalleryItemProps[]; initialIndex: number} | null {
    const targetSource = readResource(target);
    if (!targetSource) return null;

    const targetItem = createGalleryItem(targetSource, options, copyLinkTitle);
    if (!targetItem) return null;

    const items = [...(options.additionalItems ?? [])];
    let initialIndex = -1;

    for (const element of Array.from(root.querySelectorAll('img,a'))) {
        const slot = element.closest(`[${VIEWER_SLOT_ATTRIBUTE}]`);
        if (slot && root.contains(slot)) continue;

        if (element === target) {
            initialIndex = items.length;
            items.push(targetItem);
            continue;
        }

        const source = readResource(element);
        if (!source) continue;

        const item = createGalleryItem(source, options, copyLinkTitle);
        if (!item) continue;

        items.push(item);
    }

    return initialIndex === -1 ? null : {items, initialIndex};
}

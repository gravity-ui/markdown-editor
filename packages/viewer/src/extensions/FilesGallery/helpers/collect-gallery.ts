import type {GalleryItemProps} from '@gravity-ui/components';

import {inspectViewerNode} from '../../../utils/inspect-viewer-node';
import {FILES_GALLERY_EXCLUDE_ATTRIBUTE} from '../constants';
import type {FilesGalleryProps} from '../types';

import {createGalleryItem} from './create-gallery-item';
import {readResource} from './read-resource';

const excludeSelector = `[${FILES_GALLERY_EXCLUDE_ATTRIBUTE}]`;

/** Whether the element is inside a subtree that opts out of the gallery. */
export function isExcludedFromGallery(element: Element): boolean {
    return element.closest(excludeSelector) !== null;
}

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
        if (inspectViewerNode(root, element).kind !== 'content') continue;
        if (isExcludedFromGallery(element)) continue;

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

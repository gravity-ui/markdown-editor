import {Portal} from '@gravity-ui/uikit';

import type {ReactRenderer, RendererItem} from '../../extensions/behavior/ReactRenderer';
import {
    ImageSkeleton,
    createImageSkeletonContainer,
} from '../../react-utils/components/ImageSkeleton';
import {UploadLabel} from '../../react-utils/components/UploadLabel';

import type {ReplacementResource} from './types';

const items = new WeakMap<HTMLElement, RendererItem>();

/** Presentation shared with uploads, without invoking the file upload pipeline. */
export function createResourceIndicator(
    resource: ReplacementResource,
    renderer?: ReactRenderer,
    imageSize?: {width: string | number; height: string | number},
) {
    const skeleton =
        imageSize &&
        createImageSkeletonContainer({
            width: String(imageSize.width),
            height: String(imageSize.height),
        });
    const dom = skeleton || document.createElement('span');
    dom.dataset.resourcePending = resource.kind;
    dom.contentEditable = 'false';
    dom.setAttribute('role', 'status');
    dom.setAttribute('aria-label', resource.name || resource.value);
    if (renderer)
        items.set(
            dom,
            renderer.createItem('resource-pending', () => (
                <Portal container={dom}>
                    {skeleton ? (
                        <ImageSkeleton />
                    ) : (
                        <UploadLabel
                            fileName={resource.name || resource.value}
                            fileType={resource.kind === 'image' ? 'image' : 'file'}
                            status="uploading"
                            onReUploadClick={() => {}}
                        />
                    )}
                </Portal>
            )),
        );
    else dom.textContent = resource.name || resource.value;
    return dom;
}

export function destroyResourceIndicator(dom: HTMLElement) {
    items.get(dom)?.remove();
    items.delete(dom);
}

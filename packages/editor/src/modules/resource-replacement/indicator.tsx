import {Portal} from '@gravity-ui/uikit';

import type {ReactRenderer, RendererItem} from '../../extensions/behavior/ReactRenderer';
import {ImageSkeletonDescriptor} from '../../extensions/yfm/ImgSize/ImagePaste/skeleton';
import {UploadLabel} from '../../markup/codemirror/files-upload-plugin/widget';

import type {ReplacementResource} from './types';

const items = new WeakMap<HTMLElement, RendererItem>();

/** Presentation shared with uploads, without invoking the file upload pipeline. */
// Нельзя ли переиспользовать существующий
export function createResourceIndicator(
    resource: ReplacementResource,
    renderer?: ReactRenderer,
    imageSize?: {width: string | number; height: string | number},
) {
    const skeleton =
        imageSize &&
        new ImageSkeletonDescriptor(0, {
            width: String(imageSize.width),
            height: String(imageSize.height),
        });
    const dom = skeleton ? skeleton.getDomElem() : document.createElement('span');
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
                        skeleton.renderReactElement()
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

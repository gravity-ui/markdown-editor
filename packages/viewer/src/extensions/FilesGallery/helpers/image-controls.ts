import type {ViewerEffectContext} from '../../../lifecycle/types';
import {getDomConstructor} from '../../../utils/dom-constructor';
import {inspectViewerNode} from '../../../utils/inspect-viewer-node';

const attributes = ['role', 'tabindex'] as const;
const galleryButtons = new WeakSet<HTMLImageElement>();

export function registerImageControls(
    {root, signal, claim}: ViewerEffectContext,
    fallbackLabel: string,
) {
    const registered = new WeakSet<HTMLImageElement>();
    root.addEventListener(
        'keydown',
        (event) => {
            if (
                event.defaultPrevented ||
                (event.key !== 'Enter' && event.key !== ' ') ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey ||
                !isStandaloneImage(root, event.target) ||
                isPresentationalImage(event.target)
            )
                return;

            event.preventDefault();
            if (!event.repeat) event.target.click();
        },
        {signal},
    );

    root.addEventListener('load', ({target}) => registerImage(target), {capture: true, signal});
    for (const image of Array.from(root.querySelectorAll('img'))) registerImage(image);

    function registerImage(target: EventTarget | null) {
        if (
            !isStandaloneImage(root, target) ||
            isPresentationalImage(target) ||
            registered.has(target)
        )
            return;

        registered.add(target);
        claim(target, 'files-gallery:image-controls', () =>
            setImageAttributes(target, fallbackLabel),
        );
    }
}

export function isStandaloneImage(
    root: HTMLElement,
    target: EventTarget | null,
): target is HTMLImageElement {
    return (
        target instanceof getDomConstructor(root, 'HTMLImageElement') &&
        Boolean(target.currentSrc || target.getAttribute('src')) &&
        (!target.hasAttribute('role') ||
            target.getAttribute('role') === 'img' ||
            isPresentationalImage(target) ||
            galleryButtons.has(target)) &&
        !target.parentElement?.closest('a, button, [role="button"]') &&
        inspectViewerNode(root, target).kind === 'content'
    );
}

function isPresentationalImage(image: HTMLImageElement) {
    const role = image.getAttribute('role');
    return role === 'presentation' || role === 'none';
}

function setImageAttributes(image: HTMLImageElement, fallbackLabel: string) {
    const originalAttributes = attributes.map((name) => [name, image.getAttribute(name)] as const);
    const needsLabel = !image.hasAttribute('aria-label') && !image.hasAttribute('aria-labelledby');
    galleryButtons.add(image);
    image.setAttribute('role', 'button');
    if (!image.hasAttribute('tabindex')) image.setAttribute('tabindex', '0');
    if (needsLabel) image.setAttribute('aria-label', image.alt || image.title || fallbackLabel);

    return () => {
        galleryButtons.delete(image);
        if (needsLabel) image.removeAttribute('aria-label');
        for (const [name, value] of originalAttributes) {
            if (value === null) image.removeAttribute(name);
            else image.setAttribute(name, value);
        }
    };
}

import {getDomConstructor} from '../../../utils/dom-constructor';
import {createElementRegistration} from '../../../utils/dom-ownership';
import {inspectViewerNode} from '../../../utils/inspect-viewer-node';

const attributes = ['role', 'tabindex'] as const;
const imageControls = createElementRegistration(setImageAttributes);
const imageLabels = createElementRegistration(retainImageLabel);

export function registerImageControls(
    root: HTMLElement,
    signal: AbortSignal,
    fallbackLabel: string,
) {
    const releases = new Map<HTMLImageElement, () => void>();
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

    return () => {
        for (const release of releases.values()) release();
    };

    function registerImage(target: EventTarget | null) {
        if (
            !isStandaloneImage(root, target) ||
            isPresentationalImage(target) ||
            releases.has(target)
        )
            return;

        const releaseControls = imageControls.register(target);
        const releaseLabel = imageLabels.register(target, (isOwner) => {
            if (isOwner) {
                target.setAttribute('aria-label', target.alt || target.title || fallbackLabel);
            }
        });
        releases.set(target, () => {
            releaseLabel?.();
            releaseControls?.();
        });
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
            imageControls.has(target)) &&
        !target.parentElement?.closest('a, button, [role="button"]') &&
        inspectViewerNode(root, target).kind === 'content'
    );
}

function isPresentationalImage(image: HTMLImageElement) {
    const role = image.getAttribute('role');
    return role === 'presentation' || role === 'none';
}

function setImageAttributes(image: HTMLImageElement) {
    const originalAttributes = attributes.map((name) => [name, image.getAttribute(name)] as const);
    image.setAttribute('role', 'button');
    if (!image.hasAttribute('tabindex')) image.setAttribute('tabindex', '0');

    return () => {
        for (const [name, value] of originalAttributes) {
            if (value === null) image.removeAttribute(name);
            else image.setAttribute(name, value);
        }
    };
}

function retainImageLabel(image: HTMLImageElement) {
    if (image.hasAttribute('aria-label') || image.hasAttribute('aria-labelledby')) return undefined;

    return () => image.removeAttribute('aria-label');
}

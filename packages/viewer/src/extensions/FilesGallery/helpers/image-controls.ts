import {getDomConstructor} from '../../../utils/dom-constructor';
import {createElementRegistration} from '../../../utils/dom-ownership';
import {inspectViewerNode} from '../../../utils/inspect-viewer-node';

const attributes = ['role', 'tabindex', 'aria-label'] as const;
const imageControls = createElementRegistration(setImageAttributes);

export function registerImageControls(root: HTMLElement, signal: AbortSignal) {
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
                !isStandaloneImage(root, event.target)
            )
                return;

            event.preventDefault();
            if (!event.repeat) event.target.click();
        },
        {signal},
    );

    const releases = Array.from(root.querySelectorAll('img'))
        .filter((image) => isStandaloneImage(root, image))
        .map((image) => imageControls.register(image));

    return () => {
        for (const release of releases) release?.();
    };
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
            imageControls.has(target)) &&
        !target.parentElement?.closest('a, button, [role="button"]') &&
        inspectViewerNode(root, target).kind === 'content'
    );
}

function setImageAttributes(image: HTMLImageElement) {
    const originalAttributes = attributes.map((name) => [name, image.getAttribute(name)] as const);
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');

    if (!image.hasAttribute('aria-label') && !image.hasAttribute('aria-labelledby')) {
        image.setAttribute(
            'aria-label',
            image.alt || image.title || image.currentSrc || image.getAttribute('src') || '',
        );
    }

    return () => {
        for (const [name, value] of originalAttributes) {
            if (value === null) image.removeAttribute(name);
            else image.setAttribute(name, value);
        }
    };
}

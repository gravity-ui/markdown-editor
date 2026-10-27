import {type RefObject, useEffect} from 'react';

import {i18n} from '../../../i18n/spoiler';
import {SpoilerClassName} from '../../../markdown-it/spoiler';

import '../../../styles/yfm-spoiler.scss';

const HIDDEN_SPOILER_SELECTOR = `.${SpoilerClassName.Spoiler}:not(.${SpoilerClassName.Revealed})`;
const FOCUSABLE_SELECTOR = 'a[href], area[href], button, input, select, textarea, [tabindex]';
const SAVED_TABINDEX_ATTR = 'data-spoiler-tabindex';

/**
 * Makes spoilers in the rendered markdown interactive.
 * A hidden spoiler is a button: a click, Enter or Space shows its text.
 * The revealed state belongs to the DOM only and is lost when the html changes.
 */
export function useYfmSpoiler(ref: RefObject<HTMLElement>) {
    useEffect(() => {
        const container = ref.current;
        if (!container) return undefined;
        return bindYfmSpoilers(container);
    }, [ref]);
}

/** Adds spoiler handlers to the container. Returns a function that removes them. */
export function bindYfmSpoilers(container: HTMLElement): () => void {
    const handleEvent = (event: Event) => {
        const spoilers = getHiddenSpoilers(container, event.target);
        if (!spoilers.length) return;

        // The first activation shows the text. A link inside the spoiler does not open.
        event.preventDefault();
        event.stopPropagation();
        spoilers.forEach(revealSpoiler);
    };
    const handleClick = (event: MouseEvent) => {
        // Do not hide the text selection made with the mouse
        if (!container.ownerDocument.getSelection()?.isCollapsed) return;
        handleEvent(event);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') handleEvent(event);
    };

    prepareSpoilers(container);
    const observer = new MutationObserver(() => prepareSpoilers(container));
    observer.observe(container, {childList: true, subtree: true});

    container.addEventListener('click', handleClick, true);
    container.addEventListener('keydown', handleKeyDown, true);

    return () => {
        observer.disconnect();
        container.removeEventListener('click', handleClick, true);
        container.removeEventListener('keydown', handleKeyDown, true);
    };
}

/** Returns the hidden spoiler of the target and all hidden spoilers around it */
function getHiddenSpoilers(container: HTMLElement, target: EventTarget | null): HTMLElement[] {
    const spoilers: HTMLElement[] = [];
    let elem = target instanceof Element ? target.closest(HIDDEN_SPOILER_SELECTOR) : null;
    while (elem && elem !== container && container.contains(elem)) {
        if (elem instanceof HTMLElement) spoilers.push(elem);
        elem = elem.parentElement?.closest(HIDDEN_SPOILER_SELECTOR) ?? null;
    }
    return spoilers;
}

function prepareSpoilers(container: HTMLElement) {
    container.querySelectorAll<HTMLElement>(HIDDEN_SPOILER_SELECTOR).forEach((spoiler) => {
        if (spoiler.getAttribute('role') === 'button') return;

        spoiler.setAttribute('role', 'button');
        spoiler.setAttribute('tabindex', '0');
        spoiler.setAttribute('aria-expanded', 'false');
        spoiler.setAttribute('aria-label', i18n('label'));

        // Hidden links and controls are skipped by the Tab key
        spoiler.querySelectorAll(FOCUSABLE_SELECTOR).forEach((elem) => {
            if (elem.hasAttribute(SAVED_TABINDEX_ATTR)) return;
            elem.setAttribute(SAVED_TABINDEX_ATTR, elem.getAttribute('tabindex') ?? '');
            elem.setAttribute('tabindex', '-1');
        });
    });
}

function revealSpoiler(spoiler: HTMLElement) {
    spoiler.classList.add(SpoilerClassName.Revealed);
    spoiler.removeAttribute('role');
    spoiler.removeAttribute('aria-expanded');
    spoiler.removeAttribute('aria-label');

    // Keep the focus on the spoiler, but remove it from the Tab order
    if (spoiler.ownerDocument.activeElement === spoiler) spoiler.setAttribute('tabindex', '-1');
    else spoiler.removeAttribute('tabindex');

    spoiler.querySelectorAll(`[${SAVED_TABINDEX_ATTR}]`).forEach((elem) => {
        if (elem.closest(HIDDEN_SPOILER_SELECTOR)) return;
        const tabindex = elem.getAttribute(SAVED_TABINDEX_ATTR);
        elem.removeAttribute(SAVED_TABINDEX_ATTR);
        if (tabindex) elem.setAttribute('tabindex', tabindex);
        else elem.removeAttribute('tabindex');
    });
}

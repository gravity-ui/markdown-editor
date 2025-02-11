import {RefObject, useEffect, useState} from 'react';

import throttle from 'lodash/throttle';

/**
 * Finds the closest parent element with overflow: auto or overflow: scroll.
 *
 * This function traverses up the DOM tree starting from the given element,
 * checking each parent element for overflow: auto or overflow: scroll styles.
 * If such an element is found, it is returned as the scroll container.
 * If no matching element is found, the global window object is returned.
 *
 * @param {HTMLElement | null} element - The starting element from which to begin the search.
 * @returns {HTMLElement | Window} - The first parent with overflow: auto/scroll, or window.
 */
const findScrollContainer = (element: HTMLElement | null): HTMLElement | Window => {
    let currentElement = element;
    while (currentElement) {
        const overflow = window.getComputedStyle(currentElement).overflow;
        if (overflow === 'auto' || overflow === 'scroll') {
            return currentElement;
        }
        currentElement = currentElement.parentElement;
    }
    return window;
};

/**
 * Finds the value of a CSS variable starting from the specified element.
 * If not found locally, it will fallback to the global :root.
 *
 * @param {HTMLElement | null} element - The starting element to search for the CSS variable.
 * @param {string} variableName - The name of the CSS variable to search for.
 * @returns {number} - The value of the CSS variable or 0 if not found.
 */
const findCssVariableValue = (element: HTMLElement | null, variableName: string): number => {
    let currentElement = element;
    while (currentElement) {
        const value = getComputedStyle(currentElement).getPropertyValue(variableName);
        if (value) {
            return parseFloat(value);
        }
        currentElement = currentElement.parentElement;
    }
    // Fallback to global :root if not found locally
    return (
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue(variableName)) || 0
    );
};

interface UseStickyOptions {
    /**
     * Throttle delay in milliseconds for the scroll event handler.
     * This controls how frequently the scroll event is processed.
     * Lower values make the scroll handler more responsive but can increase CPU usage.
     *
     * Default is 100ms.
     */
    throttleDelay?: number;

    /**
     * An optional name of a CSS variable that defines an offset value for the sticky element.
     * The variable is needed to set an offset if there are other sticky or
     * fixed elements on the page.
     *
     * Default is '--g-md-sticky-offset-compensate'.
     */
    offsetCssVariable?: string;

    /**
     * An optional element reference to scope the search for the CSS variable.
     * If not provided, the search defaults to the global :root.
     */
    cssVariableScope?: HTMLElement | null;
}

/**
 * useSticky hook
 *
 * This hook determines whether an element should be in a sticky state based on its position
 * relative to the scroll container and a custom offset.
 * The offset is calculated based on the CSS variable `--g-md-toolbar-sticky-offset`.
 *
 * @param {RefObject<T>} elemRef - A reference to the DOM element for which sticky state is being managed.
 * @param {UseStickyOptions} options - Options for configuring the hook's behavior.
 * @returns {boolean} - A boolean indicating whether the element is currently sticky.
 */
export function useSticky<T extends HTMLElement>(
    elemRef: RefObject<T>,
    {
        throttleDelay = 100,
        offsetCssVariable = '--g-md-sticky-offset-compensate',
        cssVariableScope = null,
    }: UseStickyOptions = {},
) {
    const [sticky, setSticky] = useState(false);
    const [initialOffset, setInitialOffset] = useState<number | null>(null);

    useEffect(() => {
        const scrollContainer = findScrollContainer(elemRef.current);

        if (elemRef.current) {
            if (initialOffset === null) {
                // Determine the scope element for the CSS variable search
                const scopeElement = cssVariableScope || document.documentElement;
                const stickyOffsetCompensate = findCssVariableValue(
                    scopeElement,
                    offsetCssVariable,
                );

                setInitialOffset(
                    elemRef.current.getBoundingClientRect().top - stickyOffsetCompensate,
                );
            }
        }

        // Throttled scroll handler
        const handleScroll = throttle(() => {
            if (initialOffset !== null) {
                const scrollY =
                    scrollContainer === window
                        ? window.scrollY
                        : (scrollContainer as HTMLElement).scrollTop;
                const newSticky = (initialOffset ?? 0) <= scrollY;

                setSticky(newSticky);
            }
        }, throttleDelay);

        scrollContainer.addEventListener('scroll', handleScroll);

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            handleScroll.cancel(); // Cancel the throttled function
        };
    }, [elemRef, initialOffset, offsetCssVariable, throttleDelay, cssVariableScope]);

    return sticky;
}

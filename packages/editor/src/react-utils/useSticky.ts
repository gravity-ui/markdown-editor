import {useState} from 'react';

import {useEffectOnce, useLatest} from 'react-use';

import {REFLOW_EVENTS} from 'src/utils/dom';

// At fractional browser zoom (75%, 150%, 300%) a stuck element is laid out a fraction
// of a pixel below its own `top`, so an exact comparison never sees the sticky state.
const STICKY_OFFSET_TOLERANCE = 1; // px

export function useSticky<T extends HTMLElement>(elemRef: React.RefObject<T>) {
    const [sticky, setSticky] = useState(false);
    const stickyRef = useLatest(sticky);

    useEffectOnce(() => {
        let rafId: number | null = null;

        observe();

        for (const eventName of REFLOW_EVENTS) {
            window.addEventListener(eventName, scheduleObserve, true);
        }

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            for (const eventName of REFLOW_EVENTS) {
                window.removeEventListener(eventName, scheduleObserve, true);
            }
        };

        function scheduleObserve() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(observe);
        }

        function observe() {
            rafId = null;
            if (!elemRef.current) return;
            const refPageOffset = elemRef.current.getBoundingClientRect().top;
            const stickyOffset = parseFloat(getComputedStyle(elemRef.current).top);
            const scrollContainer = findScrollContainer(elemRef.current);
            const scrollOffset = scrollContainer
                ? scrollContainer.getBoundingClientRect().top + scrollContainer.clientTop
                : 0;
            const stickyActive =
                refPageOffset <= scrollOffset + stickyOffset + STICKY_OFFSET_TOLERANCE;

            if (stickyActive && !stickyRef.current) setSticky(true);
            else if (!stickyActive && stickyRef.current) setSticky(false);
        }
    });

    return sticky;
}

function findScrollContainer(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;

    while (parent && parent !== document.documentElement) {
        const {overflowY} = getComputedStyle(parent);
        if (['auto', 'scroll', 'hidden', 'overlay'].includes(overflowY)) {
            // Body overflow can be propagated to the viewport.
            if (parent === document.body) {
                const rootStyle = getComputedStyle(document.documentElement);
                if (rootStyle.overflowY === 'visible' && rootStyle.overflowX === 'visible') {
                    return null;
                }
            }
            return parent;
        }
        parent = parent.parentElement;
    }

    return null;
}

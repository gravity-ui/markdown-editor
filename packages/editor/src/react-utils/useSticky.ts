import {useState} from 'react';

import {useEffectOnce, useLatest} from 'react-use';

import {REFLOW_EVENTS} from 'src/utils/dom';

const CONTAINER_EVENTS = new Set<keyof WindowEventMap>([
    'scroll',
    'touchstart',
    'touchmove',
    'touchend',
]);

export function useSticky<T extends HTMLElement>(
    elemRef: React.RefObject<T>,
    scrollContainerRef?: React.RefObject<HTMLElement>,
) {
    const [sticky, setSticky] = useState(false);
    const stickyRef = useLatest(sticky);

    useEffectOnce(() => {
        let rafId: number | null = null;
        const scrollContainer = scrollContainerRef?.current ?? null;

        const naturalTopFromContainer =
            scrollContainer && elemRef.current
                ? elemRef.current.getBoundingClientRect().top -
                  scrollContainer.getBoundingClientRect().top -
                  scrollContainer.clientTop
                : null;

        const getTarget = (eventName: keyof WindowEventMap): EventTarget =>
            CONTAINER_EVENTS.has(eventName) && scrollContainer ? scrollContainer : window;

        observe();

        for (const eventName of REFLOW_EVENTS) {
            getTarget(eventName).addEventListener(eventName, scheduleObserve, true);
        }

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            for (const eventName of REFLOW_EVENTS) {
                getTarget(eventName).removeEventListener(eventName, scheduleObserve, true);
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
            const stickyOffset = parseInt(getComputedStyle(elemRef.current).top, 10);

            let stickyActive: boolean;
            if (scrollContainer !== null && naturalTopFromContainer !== null) {
                stickyActive = scrollContainer.scrollTop >= naturalTopFromContainer - stickyOffset;
            } else {
                const refPageOffset = elemRef.current.getBoundingClientRect().top;
                stickyActive = refPageOffset <= stickyOffset;
            }

            if (stickyActive && !stickyRef.current) setSticky(true);
            else if (!stickyActive && stickyRef.current) setSticky(false);
        }
    });

    return sticky;
}

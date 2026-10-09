import {useState} from 'react';

import {useEffectOnce, useLatest} from 'react-use';

import {REFLOW_EVENTS} from 'src/utils/dom';

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
            const stickyOffset = parseInt(getComputedStyle(elemRef.current).top, 10);
            const stickyActive = refPageOffset <= stickyOffset;

            if (stickyActive && !stickyRef.current) setSticky(true);
            else if (!stickyActive && stickyRef.current) setSticky(false);
        }
    });

    return sticky;
}

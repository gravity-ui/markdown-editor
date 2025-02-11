import {useState} from 'react';

import {useEffectOnce, useLatest} from 'react-use';

const events: ReadonlySet<keyof WindowEventMap> = new Set<keyof WindowEventMap>([
    'resize',
    'scroll',
    'touchstart',
    'touchmove',
    'touchend',
    'pageshow',
    'load',
    'orientationchange',
]);

export function useSticky<T extends HTMLElement>(elemRef: React.RefObject<T>) {
    const [sticky, setSticky] = useState(false);
    const stickyRef = useLatest(sticky);

    useEffectOnce(() => {
        observe();

        for (const eventName of events) {
            window.addEventListener(eventName, observe, true);
        }

        return () => {
            for (const eventName of events) {
                window.removeEventListener(eventName, observe, true);
            }
        };

        function observe() {
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

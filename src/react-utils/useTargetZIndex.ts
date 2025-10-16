import {useState} from 'react';

import {useEffectOnce, useLatest} from 'react-use';

import {getTargetZIndex} from '../utils/get-target-z-index';

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

export function useTargetZIndex(dataLayoutSelector: string, offset = 10): number | undefined {
    const [zIndex, setZIndex] = useState<number | undefined>(() =>
        getTargetZIndex(dataLayoutSelector, offset),
    );
    const zIndexRef = useLatest(zIndex);

    useEffectOnce(() => {
        let rafId: number | null = null;

        recalculate();

        for (const eventName of events) {
            window.addEventListener(eventName, scheduleRecalculate, true);
        }

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            for (const eventName of events) {
                window.removeEventListener(eventName, scheduleRecalculate, true);
            }
        };

        function scheduleRecalculate() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(recalculate);
        }

        function recalculate() {
            rafId = null;
            const newZIndex = getTargetZIndex(dataLayoutSelector, offset);
            if (newZIndex !== zIndexRef.current) {
                setZIndex(newZIndex);
            }
        }
    });

    return zIndex;
}

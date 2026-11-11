import {useLayoutEffect, useState} from 'react';

import {PANEL_INSET, PANEL_MAX_HEIGHT} from './const';

function getAvailableSize(block: HTMLElement) {
    return {
        maxWidth: Math.max(0, window.innerWidth - 2 * PANEL_INSET),
        maxHeight: Math.max(
            0,
            Math.min(
                PANEL_MAX_HEIGHT,
                window.innerHeight - block.getBoundingClientRect().top - 2 * PANEL_INSET,
            ),
        ),
    };
}

export function useHeaderSettingsSize(block: HTMLElement | null) {
    const [size, setSize] = useState<ReturnType<typeof getAvailableSize>>();

    useLayoutEffect(() => {
        if (!block) return undefined;

        const controller = new AbortController();
        const updateSize = () => {
            const next = getAvailableSize(block);
            setSize((previous) =>
                previous?.maxWidth === next.maxWidth && previous.maxHeight === next.maxHeight
                    ? previous
                    : next,
            );
        };
        const onScroll = (event: Event) => {
            if (event.target instanceof Node && event.target.contains(block)) updateSize();
        };

        updateSize();
        window.addEventListener('resize', updateSize, {signal: controller.signal});
        window.addEventListener('scroll', onScroll, {capture: true, signal: controller.signal});
        return () => controller.abort();
    }, [block]);

    return size;
}

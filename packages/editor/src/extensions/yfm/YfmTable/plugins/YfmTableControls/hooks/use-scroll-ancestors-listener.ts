import {useEffect} from 'react';

import {getOverflowAncestors} from '@floating-ui/react';

/**
 * Subscribes `onChange` to scroll events on all scroll-ancestor elements of `target`
 * (including `target` itself if it scrolls) and to ResizeObserver on `target`.
 *
 * This is the correct way to track position changes caused by scroll in any ancestor,
 * unlike listening only to the target element itself.
 */
export function useScrollAncestorsListener(
    target: Element | null,
    onChange: () => void,
    enabled = true,
): void {
    useEffect(() => {
        if (!enabled || !target) return undefined;

        // getOverflowAncestors returns ancestors of target, but not target itself.
        // We add target explicitly because it may be a scroll container itself
        // (e.g. <table> with display:inline-block + overflow:auto in diplodoc styles).
        const ancestors = [target, ...getOverflowAncestors(target)];
        ancestors.forEach((el) => {
            el.addEventListener('scroll', onChange, {passive: true});
        });

        const observer = new ResizeObserver(onChange);
        observer.observe(target);

        return () => {
            ancestors.forEach((el) => {
                el.removeEventListener('scroll', onChange);
            });
            observer.disconnect();
        };
    }, [target, onChange, enabled]);
}

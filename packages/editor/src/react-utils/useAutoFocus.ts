import {type RefObject, useEffect} from 'react';

/**
 * @deprecated For inputs inside Popup, pass the same ref to TextInput.controlRef
 * and Popup.initialFocus. With UIKit < 7.39.0, register the anchor before opening Popup.
 * If Popup replaces the input while open, focus the new ref with preventScroll: true.
 */
// TODO(next major): Remove useAutoFocus.
export function useAutoFocus<T extends HTMLElement>(
    ref: RefObject<T>,
    dependencies: unknown[] = [],
    timeout = 0,
) {
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            ref.current?.focus();
        }, timeout);

        return () => {
            clearTimeout(timeoutId);
        };
        // https://github.com/facebook/react/issues/23392#issuecomment-1055610198
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}

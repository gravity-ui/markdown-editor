import {type RefObject, useEffect} from 'react';

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

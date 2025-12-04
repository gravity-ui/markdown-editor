import {useCallback, useEffect, useRef} from 'react';

import {useLatest} from 'react-use';

export function useRafThrottle(fn: () => void): () => void {
    const refFn = useLatest(fn);
    const refHandle = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (refHandle.current !== null) {
                cancelAnimationFrame(refHandle.current);
            }
        };
    }, [refFn]);

    return useCallback(() => {
        if (refHandle.current === null) {
            refHandle.current = requestAnimationFrame(() => {
                refHandle.current = null;
                refFn.current();
            });
        }
    }, [refFn]);
}

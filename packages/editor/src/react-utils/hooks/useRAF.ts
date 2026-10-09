import {useCallback, useEffect, useRef} from 'react';

export function useRAF(fn: () => void): () => void {
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [fn]);

    return useCallback(() => {
        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                fn();
            });
        }
    }, [fn]);
}

import {useRef} from 'react';

import {useClientLayoutEffect} from './use-client-layout-effect';

export function useLatest<T>(value: T) {
    const ref = useRef(value);
    useClientLayoutEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
}

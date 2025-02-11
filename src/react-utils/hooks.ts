import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {useEffectOnce, useLatest} from 'react-use';

import {debounce} from '../lodash';

export const useElementState = <T extends HTMLElement>(): [T | null, React.RefCallback<T>] =>
    useState<T | null>(null);

type SetTrue = () => void;
type SetFalse = () => void;
type Toggle = () => void;
export function useBooleanState(
    initial: boolean | (() => boolean),
): [boolean, SetTrue, SetFalse, Toggle] {
    const [value, setValue] = useState<boolean>(initial);
    return [
        value,
        useCallback(() => setValue(true), []),
        useCallback(() => setValue(false), []),
        useCallback(() => setValue((val) => !val), []),
    ];
}

export const useComponentWillMount = (cb: () => void) => {
    const willMount = useRef(true);

    if (willMount.current) cb();

    willMount.current = false;
};

export const useRenderTime = (cb: (time: number) => void) => {
    let time = 0;

    useComponentWillMount(() => {
        time = Date.now();
    });

    useEffectOnce(() => {
        cb(Date.now() - time);
    });
};

type AnyFunction = (...args: any[]) => any;
export function useDebounce<Fn extends AnyFunction>(cb: Fn, wait: number) {
    const latestCb = useLatest(cb);

    const debouncedFn = useMemo(
        () =>
            debounce((...args: Parameters<Fn>) => {
                latestCb.current.apply(null, args);
            }, wait),
        [latestCb, wait],
    );

    // cancel function on unmount
    useEffect(() => () => debouncedFn.cancel(), [debouncedFn]);

    return debouncedFn;
}

import {useState, useCallback, useRef} from 'react';
import {useEffectOnce} from 'react-use';

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

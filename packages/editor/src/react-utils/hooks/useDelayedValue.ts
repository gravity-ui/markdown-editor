//
// copied from @gravity-ui/components:
// https://github.com/gravity-ui/components/blob/c31e0b98ce866a8b42da93298c83f81dfb8459f7/src/components/DelayedTextInput/hooks/useDelayedValue.ts
//

import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';

/**
 * Debounce-like hook to delay value update.
 * @param value External value that will be eventually replaced by user input.
 * @param onChange Function to update value param after specified delay.
 * @param delay Time to wait after last delayedOnChange invocation before onChange is called.
 * @example
 * const [searchTerm, setSearchTerm] = React.useState('');
 *
 * const {currentValue: userSearchTermInput, delayedOnChange: handleUserSearchTermInput} = useDelayedValue(searchTerm, setSearchTerm);
 */
export function useDelayedValue<TValue = unknown>(
    value: TValue,
    onChange: (value: TValue) => void,
    delay = 200,
) {
    const [currentValue, setCurrentValue] = useState<TValue>(value);

    const timeoutRef = useRef<number | undefined>(undefined);

    const delayedOnChange = useCallback(
        (nextValue: TValue) => {
            setCurrentValue(nextValue);

            window.clearTimeout(timeoutRef.current);

            timeoutRef.current = window.setTimeout(() => {
                onChange(nextValue);
            }, delay);
        },
        [delay, onChange],
    );

    useEffect(() => {
        setCurrentValue((currValue) => (currValue === value ? currValue : value));
    }, [value]);

    useLayoutEffect(() => {
        return () => {
            window.clearTimeout(timeoutRef.current);
        };
    }, []);

    return {
        currentValue,
        delayedOnChange,
    };
}

import {useLayoutEffect} from 'react';
import type {RefObject} from 'react';

import {focusWithoutScroll} from '../utils';

export type UseAutoFocusProps = {
    shouldFocus?: boolean;
    containerRef?: RefObject<HTMLElement>;
    elementSelector: string;
};

export function useAutoFocus({
    containerRef,
    elementSelector,
    shouldFocus = true,
}: UseAutoFocusProps) {
    useLayoutEffect(() => {
        if (!shouldFocus) {
            return;
        }

        const container = containerRef ? containerRef.current : document;

        if (!container) {
            return;
        }

        const element = container.querySelector<HTMLElement>(elementSelector);

        focusWithoutScroll(element);
    }, [containerRef, elementSelector, shouldFocus]);
}

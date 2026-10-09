import {useCallback, useEffect, useState} from 'react';

import {useLatest} from 'react-use';

import {useRAF} from 'src/react-utils/hooks/useRAF';
import {REFLOW_EVENTS, areElementsIntersecting} from 'src/utils/dom';

export type UseObserveIntersectionProps = {
    floatingRef: React.RefObject<HTMLElement>;
    container: Element;
    selector: string;
    observerOptions?: MutationObserverInit;
};

export type UseObserveIntersectionReturn = {
    intersection: boolean;
};

export function useObserveIntersection({
    floatingRef,
    container,
    selector,
    observerOptions,
}: UseObserveIntersectionProps): UseObserveIntersectionReturn {
    const [intersection, setIntersection] = useState<boolean>(false);
    const intersectionRef = useLatest<boolean>(intersection);

    const updateFunction = useCallback(() => {
        const floating = floatingRef.current;
        const element = container.querySelector(selector);

        if (!element || !floating) {
            if (intersectionRef.current) setIntersection(false);
            return;
        }

        const isIntersecting = areElementsIntersecting(element, floating);
        if (isIntersecting !== intersectionRef.current) setIntersection(isIntersecting);
    }, [container, floatingRef, intersectionRef, selector]);

    const observer = useRAF(updateFunction);

    useEffect(() => {
        observer();

        const containerObserver = new MutationObserver(observer);

        containerObserver.observe(
            container,
            observerOptions ?? {
                childList: true,
                subtree: true,
                attributes: true,
            },
        );

        for (const event of REFLOW_EVENTS) {
            window.addEventListener(event, observer);
        }

        return () => {
            containerObserver.disconnect();

            for (const event of REFLOW_EVENTS) {
                window.removeEventListener(event, observer);
            }
        };
    }, [container, observer, observerOptions]);

    return {intersection};
}

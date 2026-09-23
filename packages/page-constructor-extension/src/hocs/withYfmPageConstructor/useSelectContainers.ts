import {type RefObject, useEffect, useState} from 'react';

export const useSelectContainers = ({
    domRef,
    html,
    selector,
}: {
    html: string;
    domRef: RefObject<HTMLElement>;
    selector: string;
}) => {
    const [containers, setContainers] = useState<Element[]>([]);
    useEffect(() => {
        const domElem = domRef.current;

        if (!domElem) {
            return;
        }

        const found = Array.from(domElem.querySelectorAll(selector));
        setContainers(found);
    }, [domRef, html, selector]);

    return containers;
};

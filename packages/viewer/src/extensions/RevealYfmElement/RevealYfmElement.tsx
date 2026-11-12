import {useRef} from 'react';

import {useViewerEffect} from '../../hooks/use-viewer-effect';
import {type RevealYfmTarget, revealYfmElement} from '../../utils/reveal-yfm-element';
import {useClientLayoutEffect} from '../../utils/use-client-layout-effect';

export type RevealYfmElementProps = (
    | {id: string | null; selector?: never; element?: never}
    | {selector: string | null; id?: never; element?: never}
    | {element: Element | null; id?: never; selector?: never}
) & {
    onReveal?: (element: Element) => void;
};

export function RevealYfmElement({id, selector, element, onReveal}: RevealYfmElementProps) {
    const completedTarget = useRef<Omit<RevealYfmElementProps, 'onReveal'> | null>(null);
    const onRevealRef = useRef(onReveal);

    useClientLayoutEffect(() => {
        onRevealRef.current = onReveal;
    }, [onReveal]);

    useViewerEffect(
        ({root, signal}) => {
            const previous = completedTarget.current;
            if (
                previous &&
                previous.id === id &&
                previous.selector === selector &&
                previous.element === element
            ) {
                return;
            }

            completedTarget.current = null;

            let target: RevealYfmTarget | null = element ?? null;
            if (typeof id === 'string') target = {id};
            else if (typeof selector === 'string') target = {selector};

            const revealed = revealYfmElement(target, {root});
            if (!revealed || signal.aborted) return;

            completedTarget.current = {id, selector, element};
            onRevealRef.current?.(revealed);
        },
        [id, selector, element],
    );

    return null;
}

import {type ReactElement, type ReactNode, useState} from 'react';

import {createPortal} from 'react-dom';

import {useViewerEffect} from '../../hooks/use-viewer-effect';

import {VIEWER_SLOT_ATTRIBUTE} from './constants';

export interface ViewerTargetsProps {
    selector: string;
    as?: 'span' | 'div';
    children: (target: HTMLElement) => ReactNode;
}

export function ViewerTargets({
    selector,
    as: Slot = 'span',
    children,
}: ViewerTargetsProps): ReactElement | null {
    const [{targets}, setState] = useState(() => ({
        targets: new Map<HTMLElement, number>(),
        nextKey: 0,
    }));

    useViewerEffect(
        ({root}) => {
            const hosts: HTMLElement[] = [];
            for (const target of Array.from(root.querySelectorAll(selector))) {
                const slot = target.closest(`[${VIEWER_SLOT_ATTRIBUTE}]`);
                if (target instanceof HTMLElement && !(slot && root.contains(slot))) {
                    hosts.push(target);
                }
            }
            setState((previous) => {
                const nextTargets = new Map<HTMLElement, number>();
                let nextKey = previous.nextKey;
                for (const host of hosts) {
                    nextTargets.set(host, previous.targets.get(host) ?? nextKey++);
                }
                return {targets: nextTargets, nextKey};
            });
        },
        [selector],
    );

    return (
        <>
            {Array.from(targets, ([target, key]) =>
                createPortal(
                    <Slot {...{[VIEWER_SLOT_ATTRIBUTE]: ''}}>{children(target)}</Slot>,
                    target,
                    String(key),
                ),
            )}
        </>
    );
}

import {type ReactElement, type ReactNode, useContext, useState} from 'react';

import type {DOMProps} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

import {useViewerEffect} from '../../hooks/use-viewer-effect';
import {ViewerContext, ViewerHtmlContext} from '../../lifecycle/context';
import {inspectViewerNode} from '../../utils/inspect-viewer-node';

import {VIEWER_SLOT_ATTRIBUTE} from './constants';

export interface ViewerTargetsProps extends DOMProps {
    selector: string;
    as?: 'span' | 'div';
    children: (target: HTMLElement) => ReactNode;
}

export function ViewerTargets({
    selector,
    as: Slot = 'span',
    className,
    style,
    children,
}: ViewerTargetsProps): ReactElement | null {
    const lifecycle = useContext(ViewerContext);
    const html = useContext(ViewerHtmlContext);
    if (!lifecycle) throw new Error('ViewerTargets must be used inside MarkdownViewer');

    const [{html: targetsHtml, targets}, setState] = useState(() => ({
        html,
        targets: new Map<HTMLElement, number>(),
        nextKey: 0,
    }));

    useViewerEffect(
        ({root}) => {
            const HTMLElementConstructor =
                root.ownerDocument.defaultView?.HTMLElement ?? HTMLElement;
            const hosts: HTMLElement[] = [];
            for (const target of Array.from(root.querySelectorAll(selector))) {
                if (
                    target instanceof HTMLElementConstructor &&
                    inspectViewerNode(root, target).kind === 'content'
                ) {
                    hosts.push(target);
                }
            }
            setState((previous) => {
                const nextTargets = new Map<HTMLElement, number>();
                let nextKey = previous.nextKey;
                for (const host of hosts) {
                    nextTargets.set(host, previous.targets.get(host) ?? nextKey++);
                }
                return {html, targets: nextTargets, nextKey};
            });
        },
        [html, selector],
    );

    if (targetsHtml !== html) return null;

    return (
        <>
            {Array.from(targets, ([target, key]) =>
                createPortal(
                    <Slot {...{[VIEWER_SLOT_ATTRIBUTE]: ''}} className={className} style={style}>
                        {children(target)}
                    </Slot>,
                    target,
                    String(key),
                ),
            )}
        </>
    );
}

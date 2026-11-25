import {type ReactElement, type ReactNode, useContext, useState} from 'react';

import type {DOMProps} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

import {VIEWER_SLOT_ATTRIBUTE} from '../../constants';
import {useViewerEffect} from '../../hooks/use-viewer-effect';
import {ViewerContext, ViewerHtmlContext} from '../../lifecycle/context';
import type {ElementClaims} from '../../lifecycle/element-claims';
import {getDomConstructor} from '../../utils/dom-constructor';
import {inspectViewerNode} from '../../utils/inspect-viewer-node';
import {useClientLayoutEffect} from '../../utils/use-client-layout-effect';

export interface ViewerTargetsProps extends DOMProps {
    selector: string;
    /** Render only the first slot with this key on each target. By default, slots are independent. */
    slotKey?: string;
    as?: 'span' | 'div';
    children: (target: HTMLElement) => ReactNode;
}

export function ViewerTargets({
    selector,
    slotKey,
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
            const HostElement = getDomConstructor(root, 'HTMLElement');
            const hosts: HTMLElement[] = [];
            for (const target of Array.from(root.querySelectorAll(selector))) {
                if (
                    target instanceof HostElement &&
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
                slotKey === undefined ? (
                    renderSlot(target, key)
                ) : (
                    <NamedSlot
                        key={key}
                        claims={lifecycle.slotClaims}
                        target={target}
                        slotKey={slotKey}
                    >
                        {() => renderSlot(target, key)}
                    </NamedSlot>
                ),
            )}
        </>
    );

    function renderSlot(target: HTMLElement, key: number) {
        return createPortal(
            <Slot {...{[VIEWER_SLOT_ATTRIBUTE]: ''}} className={className} style={style}>
                {children(target)}
            </Slot>,
            target,
            String(key),
        );
    }
}

function NamedSlot({
    claims,
    target,
    slotKey,
    children,
}: {
    claims: ElementClaims;
    target: HTMLElement;
    slotKey: string;
    children: () => ReactElement;
}) {
    const [activeKey, setActiveKey] = useState<string>();

    useClientLayoutEffect(
        () =>
            claims.claim(target, slotKey, () => {
                setActiveKey(slotKey);
                return () => setActiveKey(undefined);
            }),
        [claims, target, slotKey],
    );

    return activeKey === slotKey ? children() : null;
}

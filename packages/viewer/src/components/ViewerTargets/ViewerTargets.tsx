import {Fragment, type ReactElement, type ReactNode, useContext, useRef, useState} from 'react';

import type {DOMProps} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

import {VIEWER_SLOT_ATTRIBUTE} from '../../constants';
import {useClientLayoutEffect} from '../../hooks/use-client-layout-effect';
import {useLatest} from '../../hooks/use-latest';
import {useViewerEffect} from '../../hooks/use-viewer-effect';
import {ViewerContext, ViewerHtmlContext} from '../../lifecycle/context';
import type {ViewerLifecycle} from '../../lifecycle/viewer-lifecycle';

import {TargetRegistry} from './target-registry';

type TargetModeProps =
    | {
          /** Adds a slot after the original content. This is the default. */
          mode?: 'append';
          /** Renders one slot per key and target. By default, slots are independent. */
          slotKey?: string;
      }
    | {
          /** Temporarily replaces the children of each target with an exclusive slot. */
          mode: 'replace';
          slotKey?: never;
      };

export type ViewerTargetsProps = DOMProps &
    TargetModeProps & {
        selector: string;
        as?: 'span' | 'div';
        children: (target: HTMLElement) => ReactNode;
    };

export function ViewerTargets(props: ViewerTargetsProps): ReactElement | null {
    const lifecycle = useContext(ViewerContext);
    const html = useContext(ViewerHtmlContext);
    if (!lifecycle) throw new Error('ViewerTargets must be used inside MarkdownViewer');

    const slot = props.slotKey === undefined ? (props.mode ?? 'append') : `key:${props.slotKey}`;
    return (
        <Fragment key={html}>
            <ViewerTargetSlots key={slot} {...props} lifecycle={lifecycle} />
        </Fragment>
    );
}

function ViewerTargetSlots({
    selector,
    slotKey,
    mode = 'append',
    as: Slot = 'span',
    className,
    style,
    children,
    lifecycle,
}: ViewerTargetsProps & {lifecycle: ViewerLifecycle}) {
    const [targets, setTargets] = useState<[HTMLElement, number][]>([]);
    const [canResume, setCanResume] = useState<((target: HTMLElement) => boolean) | null>(null);
    const select = useRef<((value: string) => void) | null>(null);
    const latestSelector = useLatest(selector);
    useViewerEffect(
        ({root, signal}) => {
            const subscription = lifecycle
                .getTargets(root, TargetRegistry)
                .subscribe(latestSelector.current, mode, slotKey, signal, setTargets);
            select.current = subscription.select;
            setCanResume(null);
            return () => {
                select.current = null;
                subscription.remove();
                // Suspense keeps the portal state while layout effects are disconnected.
                setCanResume(() => subscription.canResume);
            };
        },
        [lifecycle, latestSelector, mode, slotKey],
    );
    useClientLayoutEffect(() => select.current?.(selector), [selector]);

    return targets.map(([target, key]) => {
        if (canResume && !canResume(target)) return null;
        return createPortal(
            <Slot {...{[VIEWER_SLOT_ATTRIBUTE]: ''}} className={className} style={style}>
                {children(target)}
            </Slot>,
            target,
            String(key),
        );
    });
}

///
/// Fork of Popup component from @gravity-ui/uikit
/// This fork does not use floating focus manager
///

import {useEffect} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import {
    FloatingNode,
    FloatingTree,
    type OffsetOptions,
    type Placement,
    autoUpdate,
    offset as offsetMiddleware,
    useFloating,
    useFloatingNodeId,
    useFloatingParentNodeId,
    useInteractions,
    useTransitionStatus,
} from '@floating-ui/react';
import {type DOMProps, Portal, type QAProps} from '@gravity-ui/uikit';

import {cn} from '@gravity-ui/markdown-editor';

import './popup.scss';

const b = cn('dnd-grip-popup');

export type GripPopupProps = QAProps &
    DOMProps & {
        open?: boolean;
        zIndex?: number;
        placement: Placement;
        offset?: OffsetOptions;
        anchorElement: Element | undefined | null;
        children: React.ReactNode;
    };

export const GripPopup: React.FC<GripPopupProps> = function GripPopup(props: GripPopupProps) {
    const {anchorElement, zIndex = 1000, style, className, qa, children} = props;

    const nodeId = useFloatingNodeId();
    const parentId = useFloatingParentNodeId();

    const {refs, elements, floatingStyles, placement, context, update} = useFloating({
        nodeId,
        open: props.open,
        placement: props.placement,
        middleware: [offsetMiddleware(props.offset)],
    });

    const {getFloatingProps} = useInteractions();

    useEffect(() => {
        if (anchorElement !== undefined && anchorElement !== refs.reference.current) {
            refs.setReference(anchorElement);
        }
    }, [anchorElement, refs]);

    const {isMounted, status} = useTransitionStatus(context, {
        duration: 100,
    });

    useEffect(() => {
        if (isMounted && elements.reference && elements.floating) {
            return autoUpdate(elements.reference, elements.floating, update);
        }
        return undefined;
    }, [isMounted, elements, update]);

    function wrapper(node: JSX.Element) {
        if (parentId === null) {
            return <FloatingTree>{node}</FloatingTree>;
        }

        return node;
    }

    return wrapper(
        <FloatingNode id={nodeId}>
            {isMounted ? (
                <Portal>
                    <div
                        ref={refs.setFloating}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex,
                            width: 'max-content',
                            pointerEvents: isMounted ? 'auto' : 'none',
                            outline: 'none',
                            ...floatingStyles,
                        }}
                        data-floating-ui-placement={placement}
                        data-floating-ui-status={status}
                        {...getFloatingProps()}
                    >
                        <div className={b({open: isMounted}, className)} style={style} data-qa={qa}>
                            {children}
                        </div>
                    </div>
                </Portal>
            ) : null}
        </FloatingNode>,
    );
};

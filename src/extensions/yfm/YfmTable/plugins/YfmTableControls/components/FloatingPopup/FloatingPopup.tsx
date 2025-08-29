///
/// Fork of Popup component from @gravity-ui/uikit
/// This fork does not use floating focus manager
///

import {useEffect, useMemo} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import {
    FloatingNode,
    FloatingTree,
    type OffsetOptions,
    type Placement,
    type ReferenceType,
    autoUpdate,
    offset as offsetMiddleware,
    useFloating,
    useFloatingNodeId,
    useFloatingParentNodeId,
    useInteractions,
} from '@floating-ui/react';
import {type DOMProps, Portal, type QAProps} from '@gravity-ui/uikit';

import {cn} from 'src/classname';

import './FloatingPopup.scss';

const b = cn('yfm-table-floating-popup');

export type FloatingPopupProps = QAProps &
    DOMProps & {
        open?: boolean;
        zIndex?: number;
        placement: Placement;
        offset?: OffsetOptions;
        anchorElement: ReferenceType | undefined | null;
        children: React.ReactNode;
        floatingStyles?: React.CSSProperties;
    };

export const FloatingPopup: React.FC<FloatingPopupProps> = function YfmTableFloatingPopup(
    props: FloatingPopupProps,
) {
    const {
        anchorElement,
        zIndex = 1000,
        style,
        className,
        qa,
        children,
        floatingStyles: floatingStylesFromProps,
    } = props;

    const nodeId = useFloatingNodeId();
    const parentId = useFloatingParentNodeId();

    const middleware = useMemo(() => [offsetMiddleware(props.offset)], [props.offset]);

    const {
        refs,
        elements,
        floatingStyles,
        placement,
        context: {open},
        update,
    } = useFloating({
        nodeId,
        open: props.open,
        placement: props.placement,
        middleware,
    });

    const {getFloatingProps} = useInteractions();

    useEffect(() => {
        if (anchorElement !== undefined && anchorElement !== refs.reference.current) {
            refs.setReference(anchorElement);
        }
    }, [anchorElement, refs]);

    useEffect(() => {
        if (elements.reference && elements.floating) {
            return autoUpdate(elements.reference, elements.floating, update);
        }
        return undefined;
    }, [elements, update]);

    function wrapper(node: JSX.Element) {
        if (parentId === null) {
            return <FloatingTree>{node}</FloatingTree>;
        }

        return node;
    }

    return wrapper(
        <FloatingNode id={nodeId}>
            {open ? (
                <Portal>
                    <div
                        ref={refs.setFloating}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex,
                            width: 'max-content',
                            pointerEvents: 'auto',
                            outline: 'none',
                            ...floatingStylesFromProps,
                            ...floatingStyles,
                        }}
                        data-floating-ui-placement={placement}
                        {...getFloatingProps()}
                    >
                        <div className={b(null, className)} style={style} data-qa={qa}>
                            {children}
                        </div>
                    </div>
                </Portal>
            ) : null}
        </FloatingNode>,
    );
};

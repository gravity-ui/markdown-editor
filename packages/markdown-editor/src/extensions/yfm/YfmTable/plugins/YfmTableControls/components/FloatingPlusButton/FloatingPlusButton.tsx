import {forwardRef, useState} from 'react';

import {FloatingPopup, type FloatingPopupProps, type FloatingPopupRef} from '../FloatingPopup';

import {InsertCursor, type InsertCursorProps} from './InsertCursor';
import {PlusButton, type PlusButtonProps} from './PlusButton';

const styles: React.CSSProperties = {
    borderRadius: '100px', // button circle border radius
    background: 'transparent',
};
const placementByType: Record<InsertCursorProps['type'], FloatingPopupProps['placement']> = {
    row: 'left-end',
    column: 'top-end',
};
const offsetByType: Record<InsertCursorProps['type'], FloatingPopupProps['offset']> = {
    row: {alignmentAxis: -10},
    column: {alignmentAxis: -10},
};

export type FloatingPlusButtonRef = FloatingPopupRef & {};

export type FloatingPlusButtonProps = Pick<FloatingPopupProps, 'floatingStyles'> &
    Pick<PlusButtonProps, 'onClick'> &
    Pick<InsertCursorProps, 'type' | 'anchor'>;

export const FloatingPlusButton = forwardRef<FloatingPlusButtonRef, FloatingPlusButtonProps>(
    function YfmTableFloatingPlusButton({anchor, type, floatingStyles, ...btnProps}, ref) {
        const [hovered, setHovered] = useState(false);

        return (
            <>
                <FloatingPopup
                    open
                    ref={ref}
                    anchorElement={anchor}
                    floatingStyles={floatingStyles}
                    placement={placementByType[type]}
                    offset={offsetByType[type]}
                    style={styles}
                >
                    <PlusButton
                        {...btnProps}
                        onHoverChange={setHovered}
                        qa={`g-md-yfm-table-plus-${type}`}
                    />
                </FloatingPopup>
                {hovered && <InsertCursor anchor={anchor} type={type} />}
            </>
        );
    },
);

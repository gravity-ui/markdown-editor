import {useState} from 'react';

import {FloatingPopup, type FloatingPopupProps} from '../FloatingPopup';

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

export type FloatingPlusButtonProps = Pick<PlusButtonProps, 'onClick'> &
    Pick<InsertCursorProps, 'type' | 'anchor'>;

export const FloatingPlusButton: React.FC<FloatingPlusButtonProps> =
    function YfmTableFloatingPlusButton({anchor, type, ...btnProps}) {
        const [hovered, setHovered] = useState(false);

        return (
            <>
                <FloatingPopup
                    open
                    anchorElement={anchor}
                    placement={placementByType[type]}
                    offset={offsetByType[type]}
                    style={styles}
                >
                    <PlusButton {...btnProps} onHoverChange={setHovered} />
                </FloatingPopup>
                {hovered && <InsertCursor anchor={anchor} type={type} />}
            </>
        );
    };

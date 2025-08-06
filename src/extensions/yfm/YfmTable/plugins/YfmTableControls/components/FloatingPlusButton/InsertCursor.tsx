import {useCallback, useEffect, useState} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import {type Placement, type ReferenceElement, autoUpdate, computePosition} from '@floating-ui/dom';
import {Portal} from '@gravity-ui/uikit';
import {useLatest} from 'react-use';

import {useElementState} from 'src/react-utils';

const placementByType: Record<InsertCursorProps['type'], Placement> = {
    row: 'bottom-start',
    column: 'right-start',
};

export type InsertCursorProps = {
    anchor: ReferenceElement;
    type: 'row' | 'column';
};

export const InsertCursor: React.FC<InsertCursorProps> = function YfmTableInsertCursor({
    type,
    anchor: referenceEl,
}) {
    const [floatingEl, setFloatingEl] = useElementState();
    const {width, height, updateRect} = useSize(type, () => referenceEl.getBoundingClientRect());
    const widhtRef = useLatest(width);
    const [floatingStyles, setFloatingStyles] = useState({top: -9999, left: -9999});

    useEffect(() => {
        if (referenceEl && floatingEl) {
            return autoUpdate(referenceEl, floatingEl, () => {
                updateRect(referenceEl.getBoundingClientRect());

                computePosition(referenceEl, floatingEl, {
                    placement: placementByType[type],
                }).then(({x, y}) => {
                    if (type === 'row') setFloatingStyles({left: x, top: y - 1});
                    else setFloatingStyles({left: x - 1, top: y});
                });
            });
        }
        return undefined;
    }, [referenceEl, floatingEl, widhtRef, type, updateRect]);

    return (
        <Portal>
            <div
                ref={setFloatingEl}
                style={{
                    position: 'absolute',
                    zIndex: 1005,
                    width,
                    height,
                    pointerEvents: 'auto',
                    outline: 'none',
                    backgroundColor: 'var(--g-color-line-brand)',
                    ...floatingStyles,
                }}
            />
        </Portal>
    );
};

type Size = {
    width: number;
    height: number;
};

function useSize(type: InsertCursorProps['type'], getRect: () => Size) {
    const [size, setSize] = useState<Size>(() => getSize(type, getRect()));
    const sizeRef = useLatest(size);

    return {
        width: size.width,
        height: size.height,
        updateRect: useCallback(
            (rect: Size) => {
                const newSize = getSize(type, rect);
                if (type === 'row' && newSize.width !== sizeRef.current.width) setSize(newSize);
                if (type === 'column' && newSize.height !== sizeRef.current.height)
                    setSize(newSize);
            },
            [sizeRef, type],
        ),
    };
}

function getSize(type: InsertCursorProps['type'], rect: Size): Size {
    if (type === 'row') return {height: 2, width: rect.width};
    return {width: 2, height: rect.height};
}

import {memo, useMemo, useRef, useState} from 'react';

import type {VirtualElement} from '@floating-ui/react';

import {useRafThrottle} from '../../hooks/use-raf-throttle';
import {useScrollAncestorsListener} from '../../hooks/use-scroll-ancestors-listener';
import {
    FloatingPlusButton,
    type FloatingPlusButtonProps,
    type FloatingPlusButtonRef,
} from '../FloatingPlusButton';

type ControlType = FloatingPlusButtonProps['type'];

export type FloatingPlusControlProps = {
    type: ControlType;
    index: number;
    cellElem: Element;
    tableElem: Element;
    onClick: (rowIdx: number) => void;
};

export const FloatingPlusControl = memo<FloatingPlusControlProps>(
    function YfmTableRowFloatingPlusControl({type, index, cellElem, tableElem, onClick}) {
        const anchor = useMemo<VirtualElement>(
            () => ({
                contextElement: tableElem,
                getBoundingClientRect() {
                    const cellRect = cellElem.getBoundingClientRect();
                    const tableRect = tableElem.getBoundingClientRect();

                    return type === 'row'
                        ? {
                              x: tableRect.x,
                              y: cellRect.y,
                              width: tableRect.width,
                              height: cellRect.height,
                              top: cellRect.top,
                              left: tableRect.left,
                              right: tableRect.right,
                              bottom: cellRect.top,
                          }
                        : {
                              x: cellRect.x,
                              y: tableRect.y,
                              width: cellRect.width,
                              height: tableRect.height,
                              top: tableRect.top,
                              left: cellRect.left,
                              right: cellRect.right,
                              bottom: tableRect.top,
                          };
                },
            }),
            [cellElem, tableElem, type],
        );

        const [visible, setVisible] = useState(() => shouldBeVisible(type, cellElem, tableElem));
        const buttonRef = useRef<FloatingPlusButtonRef>(null);

        // autoUpdate inside FloatingPopup watches overflow ancestors of contextElement (tableElem),
        // but NOT tableElem itself — which has display:inline-block + overflow:auto in diplodoc styles.
        // useScrollAncestorsListener explicitly includes tableElem in the subscription list.
        const onChange = useRafThrottle(() => {
            buttonRef.current?.forceUpdate();
            setVisible(shouldBeVisible(type, cellElem, tableElem));
        });

        useScrollAncestorsListener(tableElem, onChange);

        return (
            <FloatingPlusButton
                ref={buttonRef}
                anchor={anchor}
                type={type}
                onClick={() => onClick(index)}
                floatingStyles={visible ? undefined : {display: 'none'}}
            />
        );
    },
);

function shouldBeVisible(type: ControlType, cellElem: Element, tableElem: Element): boolean {
    if (type !== 'column') return true;

    const THRESHOLD = 4; // px

    const cellRect = cellElem.getBoundingClientRect();
    const tableRect = tableElem.getBoundingClientRect();

    return (
        tableRect.left - cellRect.right <= THRESHOLD &&
        cellRect.right - tableRect.right <= THRESHOLD
    );
}

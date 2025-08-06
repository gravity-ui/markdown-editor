import {memo, useMemo} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {VirtualElement} from '@floating-ui/dom';

import {FloatingPlusButton, type FloatingPlusButtonProps} from '../FloatingPlusButton';

export type FloatingPlusControlProps = {
    type: FloatingPlusButtonProps['type'];
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

        return <FloatingPlusButton anchor={anchor} type={type} onClick={() => onClick(index)} />;
    },
);

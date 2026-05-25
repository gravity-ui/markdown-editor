import {memo, useCallback, useMemo, useRef, useState} from 'react';

import type {VirtualElement} from '@floating-ui/react';

import {cn} from 'src/classname';

import {useRafThrottle} from '../../hooks/use-raf-throttle';
import {useScrollAncestorsListener} from '../../hooks/use-scroll-ancestors-listener';
import type {ResizeSegment} from '../../utils';
import {FloatingPopup, type FloatingPopupRef} from '../FloatingPopup';

import './FloatingResizeHandle.scss';

const b = cn('yfm-table-resize-handle');

const MIN_COLUMN_WIDTH = 40;

export type FloatingResizeHandleProps = {
    /** DOM element of any real cell in the column to the left of the border */
    borderCellElem: Element;
    /** Index of the column whose right border this handle represents */
    borderIdx: number;
    tableElem: Element;
    segments: ResizeSegment[];
    /**
     * Returns sum of px widths of all columns except `borderIdx`. Called once at drag start
     * to compute the constant base for updating `<table>.min-width` during drag.
     */
    getOtherColumnsWidthSum: (borderIdx: number) => number;
    onResize: (newWidthPx: number) => void;
};

export const FloatingResizeHandle = memo<FloatingResizeHandleProps>(
    function YfmTableFloatingResizeHandle({
        borderCellElem,
        borderIdx,
        tableElem,
        segments,
        getOtherColumnsWidthSum,
        onResize,
    }) {
        const popupRef = useRef<FloatingPopupRef>(null);
        const [isActive, setIsActive] = useState(false);

        const anchor = useMemo<VirtualElement>(
            () => ({
                contextElement: tableElem,
                getBoundingClientRect() {
                    const cellRect = borderCellElem.getBoundingClientRect();
                    const tableRect = tableElem.getBoundingClientRect();
                    return {
                        x: cellRect.right,
                        y: tableRect.top,
                        width: 0,
                        height: tableRect.height,
                        top: tableRect.top,
                        left: cellRect.right,
                        right: cellRect.right,
                        bottom: tableRect.bottom,
                    };
                },
            }),
            [borderCellElem, tableElem],
        );

        // autoUpdate inside FloatingPopup watches overflow ancestors of contextElement (tableElem),
        // but NOT tableElem itself (which scrolls via display:inline-block + overflow:auto).
        // We manually trigger forceUpdate and segment recomputation on tableElem scroll/resize.
        const [layoutTick, setLayoutTick] = useState(0);
        const onLayoutChange = useRafThrottle(() => {
            popupRef.current?.forceUpdate();
            setLayoutTick((t) => t + 1);
        });
        useScrollAncestorsListener(tableElem, onLayoutChange);

        const isDraggingRef = useRef(false);
        const startXRef = useRef(0);
        const startWidthRef = useRef(0);
        const lastWidthRef = useRef(0);

        const handleMouseDown = useCallback(
            (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                isDraggingRef.current = true;
                startXRef.current = e.clientX;
                startWidthRef.current = borderCellElem.getBoundingClientRect().width;
                lastWidthRef.current = startWidthRef.current;

                // Snapshot sum of px widths of all other columns. Stays constant during drag.
                const baseWidthsSum = getOtherColumnsWidthSum(borderIdx);

                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';

                setIsActive(true);

                const onMouseMove = (moveEvent: MouseEvent) => {
                    if (!isDraggingRef.current) return;
                    const delta = moveEvent.clientX - startXRef.current;
                    const desired = Math.max(MIN_COLUMN_WIDTH, startWidthRef.current + delta);

                    // Optimistic: update <col> width directly in colgroup
                    const colgroup = tableElem.querySelector('colgroup');
                    const col = colgroup?.children[borderIdx] as HTMLElement | undefined;
                    if (col) {
                        col.style.width = `${desired}px`;
                    }

                    // Read back actual width: if content's min-content prevents shrinking,
                    // actual > desired. Pin lastWidth to actual — resizer stays at min-content
                    // boundary while cursor goes further left. It will resume tracking the
                    // cursor only when desired (driven by clientX) catches up to actual.
                    const actual = borderCellElem.getBoundingClientRect().width;
                    if (actual > desired) {
                        lastWidthRef.current = actual;
                        if (col) {
                            col.style.width = `${actual}px`;
                        }
                    } else {
                        lastWidthRef.current = desired;
                    }

                    // Update <table>.min-width so the wrapper's overflow:auto kicks in
                    // when total column widths exceed available space.
                    const totalPx = baseWidthsSum + lastWidthRef.current;
                    (tableElem as HTMLElement).style.minWidth = `${totalPx}px`;
                    // Force floating-ui to recalculate anchor position after col width change
                    popupRef.current?.forceUpdate();
                };

                const onMouseUp = () => {
                    if (!isDraggingRef.current) return;
                    isDraggingRef.current = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    setIsActive(false);

                    onResize(lastWidthRef.current);

                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };

                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            },
            [borderCellElem, borderIdx, tableElem, getOtherColumnsWidthSum, onResize],
        );

        // Compute segment positions relative to table top.
        // layoutTick and isActive trigger recalculation on scroll/resize and after drag ends.
        const segmentStyles = computeSegmentStyles(
            segments,
            tableElem,
            // isActive and layoutTick are passed to force recomputation on drag end and layout changes
            isActive,
            layoutTick,
        );

        return (
            <FloatingPopup
                ref={popupRef}
                open
                anchorElement={anchor}
                placement="right-start"
                offset={0}
            >
                <div className={b({active: isActive})} onMouseDown={handleMouseDown}>
                    {segmentStyles.map((style, idx) => (
                        <div
                            key={idx}
                            className={b('segment')}
                            style={{top: style.top, height: style.height}}
                        />
                    ))}
                </div>
            </FloatingPopup>
        );
    },
);

type SegmentStyle = {top: number; height: number};

// Standalone function so ESLint doesn't complain about unused deps in useMemo.
// `_isActive` and `_layoutTick` are accepted to force recomputation by callers.
function computeSegmentStyles(
    segments: ResizeSegment[],
    tableElem: Element,
    _isActive: boolean,
    _layoutTick: number,
): SegmentStyle[] {
    const tableRect = tableElem.getBoundingClientRect();
    const rows = tableElem.querySelectorAll('tr');

    return segments.map((seg) => {
        const startRow = rows[seg.rowStart];
        const endRow = rows[seg.rowEnd];

        if (startRow && endRow) {
            const startRect = startRow.getBoundingClientRect();
            const endRect = endRow.getBoundingClientRect();
            return {
                top: startRect.top - tableRect.top,
                height: endRect.bottom - startRect.top,
            };
        }

        return {top: 0, height: tableRect.height};
    });
}

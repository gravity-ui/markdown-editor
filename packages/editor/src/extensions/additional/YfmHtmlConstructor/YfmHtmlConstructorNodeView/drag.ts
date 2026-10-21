import {useEffect, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';

import type {HtmlConstructorBlock} from '../types';

export const BLOCK_ID_ATTR = 'data-yfm-html-constructor-block-id';

export const getBlockDragAttrs = (id: string) => ({[BLOCK_ID_ATTR]: id});

export type DropPlacement = 'before' | 'after';

export interface DropTarget {
    id: string;
    placement: DropPlacement;
}

const getDropPlacement = (rect: DOMRect, clientX: number, clientY: number): DropPlacement => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const useHorizontalAxis = Math.abs(clientX - centerX) > Math.abs(clientY - centerY);

    if (useHorizontalAxis) {
        return clientX < centerX ? 'before' : 'after';
    }

    return clientY < centerY ? 'before' : 'after';
};

const getPointerDropTarget = (
    {clientX, clientY}: PointerEvent,
    draggedId: string,
): DropTarget | null => {
    const target = document
        .elementFromPoint(clientX, clientY)
        ?.closest<HTMLElement>(`[${BLOCK_ID_ATTR}]`);
    const targetId = target?.getAttribute(BLOCK_ID_ATTR) ?? null;

    if (!target || !targetId || targetId === draggedId) return null;

    return {
        id: targetId,
        placement: getDropPlacement(target.getBoundingClientRect(), clientX, clientY),
    };
};

const getReorderedBlocks = (
    blocks: HtmlConstructorBlock[],
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
) => {
    if (draggedId === targetId) return null;

    const dragged = blocks.find((block) => block.id === draggedId);
    if (!dragged) return null;

    const withoutDragged = blocks.filter((block) => block.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((block) => block.id === targetId);
    if (targetIndex === -1) return null;

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    const next = [
        ...withoutDragged.slice(0, insertIndex),
        dragged,
        ...withoutDragged.slice(insertIndex),
    ];

    // Dropping right next to the block's current slot (e.g. "before the next
    // block") keeps the same order. Report it as no move so the UI doesn't show a
    // drop indicator that wouldn't actually reorder anything.
    const isSameOrder = next.every((block, index) => block.id === blocks[index]?.id);
    return isSameOrder ? null : next;
};

export const useHtmlBlockDrag = ({
    blocks,
    onMove,
}: {
    blocks: HtmlConstructorBlock[];
    onMove: (blocks: HtmlConstructorBlock[]) => void;
}) => {
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
    const dragStateRef = useRef<{
        draggedId: string;
        target: DropTarget | null;
        reordered: HtmlConstructorBlock[] | null;
    } | null>(null);
    const cleanupDragListenersRef = useRef<(() => void) | null>(null);

    const clearDragging = () => {
        setDraggedBlockId(null);
        setDropTarget(null);
        dragStateRef.current = null;
    };

    const stopListening = () => {
        cleanupDragListenersRef.current?.();
        cleanupDragListenersRef.current = null;
    };

    const beginBlockDrag = (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);

        stopListening();

        dragStateRef.current = {draggedId: blockId, target: null, reordered: null};
        setDraggedBlockId(blockId);
        setDropTarget(null);

        const handlePointerMove = (pointerEvent: PointerEvent) => {
            const candidate = getPointerDropTarget(pointerEvent, blockId);
            const reordered = candidate
                ? getReorderedBlocks(blocks, blockId, candidate.id, candidate.placement)
                : null;
            // Only surface a drop target when it would actually change the order,
            // so the indicator never appears for a drop that does nothing.
            const nextTarget = reordered ? candidate : null;

            if (dragStateRef.current) {
                dragStateRef.current.target = nextTarget;
                dragStateRef.current.reordered = reordered;
            }
            setDropTarget(nextTarget);
        };

        const handlePointerUp = () => {
            const dragState = dragStateRef.current;
            if (dragState?.reordered) {
                onMove(dragState.reordered);
            }
            stopListening();
            clearDragging();
        };

        const handlePointerCancel = () => {
            stopListening();
            clearDragging();
        };

        cleanupDragListenersRef.current = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);
    };

    useEffect(() => () => stopListening(), []);

    return {beginBlockDrag, draggedBlockId, dropTarget};
};

import {useEffect, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';

import type {GridBlock} from '../types';

export const BLOCK_ID_ATTR = 'data-grid-block-id';

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

const moveBlock = (
    blocks: GridBlock[],
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
) => {
    if (draggedId === targetId) return blocks;

    const dragged = blocks.find((block) => block.id === draggedId);
    if (!dragged) return blocks;

    const withoutDragged = blocks.filter((block) => block.id !== draggedId);
    const targetIndex = withoutDragged.findIndex((block) => block.id === targetId);
    if (targetIndex === -1) return blocks;

    const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
    return [...withoutDragged.slice(0, insertIndex), dragged, ...withoutDragged.slice(insertIndex)];
};

export const useGridBlockDrag = ({
    blocks,
    onMove,
}: {
    blocks: GridBlock[];
    onMove: (blocks: GridBlock[]) => void;
}) => {
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
    const dragStateRef = useRef<{
        draggedId: string;
        target: DropTarget | null;
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

        dragStateRef.current = {draggedId: blockId, target: null};
        setDraggedBlockId(blockId);
        setDropTarget(null);

        const handlePointerMove = (pointerEvent: PointerEvent) => {
            const nextTarget = getPointerDropTarget(pointerEvent, blockId);

            if (dragStateRef.current) dragStateRef.current.target = nextTarget;
            setDropTarget(nextTarget);
        };

        const handlePointerUp = () => {
            const dragState = dragStateRef.current;
            if (dragState?.target) {
                onMove(
                    moveBlock(
                        blocks,
                        dragState.draggedId,
                        dragState.target.id,
                        dragState.target.placement,
                    ),
                );
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

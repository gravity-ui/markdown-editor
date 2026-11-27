import type {Direction} from '@gravity-ui/uikit';

import {union} from 'src/table-utils/cell-selection/rect';

export type SelectionRect = Pick<DOMRectReadOnly, 'left' | 'top' | 'right' | 'bottom'>;

type Size = {width: number; height: number};

export function getSelectionControlPosition(
    cells: SelectionRect[],
    clips: SelectionRect[],
    size: Size,
    direction: Direction,
): Pick<SelectionRect, 'left' | 'top'> | null {
    if (!cells.length || !clips.length) return null;
    const selected = cells.reduce(union);
    const available = {
        left: Math.max(...clips.map((clip) => clip.left)),
        top: Math.max(...clips.map((clip) => clip.top)),
        right: Math.min(...clips.map((clip) => clip.right)),
        bottom: Math.min(...clips.map((clip) => clip.bottom)),
    };
    if (
        Math.max(selected.left, available.left) >= Math.min(selected.right, available.right) ||
        Math.max(selected.top, available.top) >= Math.min(selected.bottom, available.bottom)
    )
        return null;
    const left = Math.max(
        available.left,
        Math.min(
            (direction === 'rtl' ? selected.left : selected.right - size.width) - 1,
            available.right - size.width,
        ),
    );
    const top = Math.max(available.top, Math.min(selected.top + 1, available.bottom - size.height));
    return {left, top};
}

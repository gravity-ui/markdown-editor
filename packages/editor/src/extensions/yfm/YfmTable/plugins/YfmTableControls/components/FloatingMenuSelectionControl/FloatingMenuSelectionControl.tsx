import {useMemo} from 'react';

import type {VirtualElement} from '@floating-ui/react';
import {
    ArrowShapeRightFromLine as AddColumnAfterIcon,
    ArrowShapeLeftFromLine as AddColumnBeforeIcon,
    ArrowShapeDownFromLine as AddRowAfterIcon,
    ArrowShapeUpFromLine as AddRowBeforeIcon,
    BroomMotion as ClearCellsIcon,
} from '@gravity-ui/icons';
import {DropdownMenu, Icon, Menu} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-table';

import {CellBgMenuItem} from '../CellBgMenuItem';
import {FloatingMenu, type FloatingMenuProps} from '../FloatingMenu/FloatingMenu';

export type FloatingMenuSelectionControlProps = {
    cellElements: readonly Element[];
    onMenuOpenToggle?: FloatingMenuProps['onOpenToggle'];
    onClearCellsClick: () => void;
    onInsertRowBeforeClick: () => void;
    onInsertRowAfterClick: () => void;
    onInsertColumnBeforeClick: () => void;
    onInsertColumnAfterClick: () => void;
    currentCellBg?: string | null;
    onCellBgChange?: (color: string | null) => void;
};

export const FloatingMenuSelectionControl: React.FC<FloatingMenuSelectionControlProps> =
    function YfmTableFloatingMenuSelectionControl({
        cellElements,
        onMenuOpenToggle,
        onClearCellsClick,
        onInsertRowBeforeClick,
        onInsertRowAfterClick,
        onInsertColumnBeforeClick,
        onInsertColumnAfterClick,
        currentCellBg,
        onCellBgChange,
    }) {
        const anchor = useMemo(() => getVirtualAnchor(cellElements), [cellElements]);
        if (!anchor) return null;

        return (
            <FloatingMenu
                dirtype="selection"
                canDrag={false}
                anchorElement={anchor}
                onOpenToggle={onMenuOpenToggle}
            >
                <Menu qa="g-md-yfm-table-selection-menu">
                    {onCellBgChange && (
                        <Menu.Group>
                            <CellBgMenuItem
                                qa="g-md-yfm-table-selection-cell-bg"
                                currentCellBg={currentCellBg}
                                onCellBgChange={onCellBgChange}
                            />
                        </Menu.Group>
                    )}
                    <Menu.Group>
                        <DropdownMenu.Item
                            qa="g-md-yfm-table-selection-add-row-before"
                            iconStart={<Icon data={AddRowBeforeIcon} />}
                            text={i18n('row.add.before')}
                            action={onInsertRowBeforeClick}
                        />
                        <DropdownMenu.Item
                            qa="g-md-yfm-table-selection-add-column-before"
                            iconStart={<Icon data={AddColumnBeforeIcon} />}
                            text={i18n('column.add.before')}
                            action={onInsertColumnBeforeClick}
                        />
                        <DropdownMenu.Item
                            qa="g-md-yfm-table-selection-add-column-after"
                            iconStart={<Icon data={AddColumnAfterIcon} />}
                            text={i18n('column.add.after')}
                            action={onInsertColumnAfterClick}
                        />
                        <DropdownMenu.Item
                            qa="g-md-yfm-table-selection-add-row-after"
                            iconStart={<Icon data={AddRowAfterIcon} />}
                            text={i18n('row.add.after')}
                            action={onInsertRowAfterClick}
                        />
                    </Menu.Group>
                    <Menu.Group>
                        <DropdownMenu.Item
                            qa="g-md-yfm-table-selection-clear-cells"
                            iconStart={<Icon data={ClearCellsIcon} />}
                            text={i18n('cells.clear')}
                            action={onClearCellsClick}
                        />
                    </Menu.Group>
                </Menu>
            </FloatingMenu>
        );
    };

function getVirtualAnchor(cellElements: readonly Element[]): VirtualElement | null {
    if (!cellElements.length) return null;
    return {
        contextElement: cellElements[0],
        getBoundingClientRect() {
            const rects = cellElements.map((element) => element.getBoundingClientRect());
            const left = Math.min(...rects.map((rect) => rect.left));
            const top = Math.min(...rects.map((rect) => rect.top));
            const right = Math.max(...rects.map((rect) => rect.right));
            const bottom = Math.max(...rects.map((rect) => rect.bottom));
            return new DOMRect(left, top, right - left, bottom - top);
        },
    };
}

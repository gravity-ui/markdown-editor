import {useMemo} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {ClientRectObject, VirtualElement} from '@floating-ui/dom';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    BroomMotion as ClearCells,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-table';

import type {DnDControlHandler} from '../../dnd/dnd';
import {FloatingMenu, type FloatingMenuProps} from '../FloatingMenu/FloatingMenu';

type ControlType = FloatingMenuProps['dirtype'];

export type FloatingMenuControlProps = {
    cellElement: Element;
    tableElement: Element;
    multiple: boolean;
    type: ControlType;
    dndHandler?: DnDControlHandler;
    onMenuOpenToggle: FloatingMenuProps['onOpenToggle'];
    onClearCellsClick: () => void;
    onInsertBeforeClick: () => void;
    onInsertAfterClick: () => void;
    onRemoveRangeClick: () => void;
    onRemoveTableClick: () => void;
};

export const FloatingMenuControl: React.FC<FloatingMenuControlProps> =
    function YfmTableFloatingMenuControl({
        type,
        multiple,
        dndHandler,
        cellElement,
        tableElement,
        onMenuOpenToggle,
        onClearCellsClick,
        onInsertBeforeClick,
        onInsertAfterClick,
        onRemoveRangeClick,
        onRemoveTableClick,
    }) {
        const dropdownItems = useMemo<FloatingMenuProps['dropdownItems']>(
            () =>
                [
                    [
                        {
                            text: i18n(`${type}.add.before`),
                            qa: `g-md-yfm-table-action-add-${type}-before`,
                            action: onInsertBeforeClick,
                            iconStart: <Icon data={type === 'row' ? ArrowUp : ArrowLeft} />,
                        },
                        {
                            text: i18n(`${type}.add.after`),
                            qa: `g-md-yfm-table-action-add-${type}-after`,
                            action: onInsertAfterClick,
                            iconStart: <Icon data={type === 'row' ? ArrowDown : ArrowRight} />,
                        },
                    ],
                    [
                        {
                            text: i18n('cells.clear'),
                            qa: `g-md-yfm-table-${type}-clear-cells`,
                            action: onClearCellsClick,
                            iconStart: <Icon data={ClearCells} />,
                        },
                    ],
                    [
                        {
                            text: i18n(`${type}.remove${multiple ? '.multiple' : ''}`),
                            qa: `g-md-yfm-table-action-remove-${type}`,
                            action: onRemoveRangeClick,
                            iconStart: <Icon data={Xmark} />,
                        },
                        {
                            theme: 'danger',
                            text: i18n('table.remove'),
                            qa: 'g-md-yfm-table-action-remove-table',
                            action: onRemoveTableClick,
                            iconStart: <Icon data={TrashBin} />,
                        },
                    ],
                ] satisfies FloatingMenuProps['dropdownItems'],
            [
                type,
                multiple,
                onClearCellsClick,
                onInsertAfterClick,
                onInsertBeforeClick,
                onRemoveRangeClick,
                onRemoveTableClick,
            ],
        );

        const anchor = useMemo(
            () => getVirtualAnchor(type, tableElement, cellElement),
            [type, tableElement, cellElement],
        );

        return (
            <FloatingMenu
                dirtype={type}
                canDrag={dndHandler ? dndHandler.canDrag() : false}
                onOpenToggle={onMenuOpenToggle}
                anchorElement={anchor}
                switcherMouseProps={
                    dndHandler
                        ? {
                              onMouseLeave: dndHandler.control_handleMouseLeave,
                              onMouseDown: dndHandler.control_handleMouseDown,
                              onMouseMove: dndHandler.control_handleMouseMove,
                              onMouseUp: dndHandler.control_handleMouseUp,
                          }
                        : undefined
                }
                dropdownItems={dropdownItems}
            />
        );
    };

function getVirtualAnchor(
    type: ControlType,
    tableElem: Element,
    cellElem: Element,
): VirtualElement {
    if (type === 'row') {
        return {
            contextElement: cellElem,
            getBoundingClientRect() {
                const cellRect = cellElem.getBoundingClientRect();
                const tableRect: ClientRectObject = tableElem.getBoundingClientRect().toJSON();

                {
                    // fix table rect
                    tableRect.x += 1;
                    tableRect.width -= 2;
                    tableRect.left += 1;
                    tableRect.right -= 1;
                }

                return {
                    // from table
                    x: tableRect.x,
                    width: tableRect.width,
                    left: tableRect.left,
                    right: tableRect.right,
                    // from cell
                    y: cellRect.y,
                    height: cellRect.height,
                    top: cellRect.top,
                    bottom: cellRect.top,
                };
            },
        };
    }

    if (type === 'column') {
        return {
            contextElement: cellElem,
            getBoundingClientRect() {
                const cellRect: ClientRectObject = cellElem.getBoundingClientRect().toJSON();
                const tableRect = tableElem.getBoundingClientRect();

                const EDGE_OFFSET = 16;

                const cellMiddle = cellRect.x + cellRect.width / 2;

                // left border of table
                if (cellMiddle - EDGE_OFFSET <= tableRect.left) {
                    const visible = cellRect.right - tableRect.left;
                    cellRect.width = (visible - EDGE_OFFSET) * 2;
                    cellRect.left = cellRect.right - cellRect.width;
                    cellRect.x = cellRect.left;
                }

                // right border of table
                if (cellMiddle + EDGE_OFFSET >= tableRect.right) {
                    const visible = tableRect.right - cellRect.left;
                    cellRect.width = (visible - EDGE_OFFSET) * 2;
                    cellRect.right = cellRect.left + cellRect.width;
                }

                return cellRect;
            },
        };
    }

    throw new Error(`Unknown control type: ${type}`);
}

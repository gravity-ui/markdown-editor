import {useMemo} from 'react';

import type {ClientRectObject, VirtualElement} from '@floating-ui/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    BroomMotion as ClearCells,
    LayoutHeader as HeaderRow,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {DropdownMenu, Flex, Icon, Menu, Switch} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-table';

import type {DnDControlHandler} from '../../dnd/dnd';
import {CellBgMenuItem} from '../CellBgMenuItem';
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
    canMakeRowHeader: boolean;
    canUnsetRowHeader: boolean;
    onMakeRowHeader: () => void;
    onUnsetRowHeader: () => void;

    cellBackgroundEnabled?: boolean;
    currentCellBg?: string | null;
    onCellBgChange?: (color: string | null) => void;
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
        canMakeRowHeader,
        canUnsetRowHeader,
        onMakeRowHeader,
        onUnsetRowHeader,

        cellBackgroundEnabled,
        currentCellBg,
        onCellBgChange,
    }) {
        const isRowHeader = Boolean(canUnsetRowHeader);
        const hiddenRowHeaderOption = !canMakeRowHeader && !canUnsetRowHeader;
        const cellBgHandler = cellBackgroundEnabled ? onCellBgChange : undefined;

        const dropdownContent = (
            <Menu>
                {(!hiddenRowHeaderOption || cellBgHandler) && (
                    <Menu.Group>
                        {!hiddenRowHeaderOption && (
                            <DropdownMenu.Item
                                qa="g-md-yfm-table-row-header-toggle"
                                iconStart={<Icon data={HeaderRow} />}
                                text={
                                    <Flex
                                        justifyContent="space-between"
                                        alignItems="center"
                                        gap={4}
                                    >
                                        {i18n(`row.header${multiple ? '.multiple' : ''}`)}
                                        <Switch
                                            size="m"
                                            checked={isRowHeader}
                                            disabled={hiddenRowHeaderOption}
                                        />
                                    </Flex>
                                }
                                action={isRowHeader ? onUnsetRowHeader : onMakeRowHeader}
                            />
                        )}
                        {cellBgHandler && (
                            <CellBgMenuItem
                                qa={`g-md-yfm-table-${type}-cell-bg`}
                                currentCellBg={currentCellBg}
                                onCellBgChange={cellBgHandler}
                            />
                        )}
                    </Menu.Group>
                )}

                <Menu.Group>
                    <DropdownMenu.Item
                        qa={`g-md-yfm-table-action-add-${type}-before`}
                        iconStart={<Icon data={type === 'row' ? ArrowUp : ArrowLeft} />}
                        text={i18n(`${type}.add.before`)}
                        action={onInsertBeforeClick}
                    />
                    <DropdownMenu.Item
                        qa={`g-md-yfm-table-action-add-${type}-after`}
                        iconStart={<Icon data={type === 'row' ? ArrowDown : ArrowRight} />}
                        text={i18n(`${type}.add.after`)}
                        action={onInsertAfterClick}
                    />
                </Menu.Group>

                <Menu.Group>
                    <DropdownMenu.Item
                        qa={`g-md-yfm-table-${type}-clear-cells`}
                        iconStart={<Icon data={ClearCells} />}
                        text={i18n('cells.clear')}
                        action={onClearCellsClick}
                    />
                </Menu.Group>

                <Menu.Group>
                    <DropdownMenu.Item
                        qa={`g-md-yfm-table-action-remove-${type}`}
                        iconStart={<Icon data={Xmark} />}
                        text={i18n(`${type}.remove${multiple ? '.multiple' : ''}`)}
                        action={onRemoveRangeClick}
                    />
                    <DropdownMenu.Item
                        qa="g-md-yfm-table-action-remove-table"
                        theme="danger"
                        iconStart={<Icon data={TrashBin} />}
                        text={i18n('table.remove')}
                        action={onRemoveTableClick}
                    />
                </Menu.Group>
            </Menu>
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
            >
                {dropdownContent}
            </FloatingMenu>
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

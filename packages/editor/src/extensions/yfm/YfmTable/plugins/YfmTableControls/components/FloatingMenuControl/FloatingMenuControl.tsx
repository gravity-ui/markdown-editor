import {useMemo} from 'react';

import type {ClientRectObject, VirtualElement} from '@floating-ui/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    BroomMotion as ClearCells,
    BucketPaint as ColorPalette,
    LayoutHeader as HeaderRow,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {type DropdownMenuItem, Flex, Icon, Switch} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-table';

import type {DnDControlHandler} from '../../dnd/dnd';
import {CellBgPalette} from '../CellBgPalette/CellBgPalette';
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
        const dropdownItems = useMemo<FloatingMenuProps['dropdownItems']>(() => {
            const headerItems: DropdownMenuItem[] = [];
            {
                const isRowHeader = Boolean(canUnsetRowHeader);
                const hiddenRowHeaderOption = !canMakeRowHeader && !canUnsetRowHeader;
                if (!hiddenRowHeaderOption) {
                    headerItems.push({
                        text: (
                            <Flex justifyContent="space-between" alignItems="center" gap={4}>
                                {i18n(`row.header${multiple ? '.multiple' : ''}`)}
                                <Switch
                                    size="m"
                                    checked={isRowHeader}
                                    disabled={hiddenRowHeaderOption}
                                />
                            </Flex>
                        ),
                        iconStart: <Icon data={HeaderRow} />,
                        qa: 'g-md-yfm-table-row-header-toggle',
                        action: isRowHeader ? onUnsetRowHeader : onMakeRowHeader,
                        hidden: hiddenRowHeaderOption,
                    });
                }
            }

            return [
                ...headerItems,
                ...(cellBackgroundEnabled && onCellBgChange
                    ? [
                          {
                              text: i18n('cells.bg'),
                              qa: `g-md-yfm-table-${type}-cell-bg`,
                              iconStart: <Icon data={ColorPalette} />,
                              items: [
                                  {
                                      text: (
                                          <CellBgPalette
                                              value={currentCellBg}
                                              onSelect={onCellBgChange}
                                          />
                                      ),
                                      action: () => {},
                                  },
                              ],
                          },
                      ]
                    : []),
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
            ] satisfies FloatingMenuProps['dropdownItems'];
        }, [
            type,
            multiple,
            canMakeRowHeader,
            canUnsetRowHeader,
            currentCellBg,
            cellBackgroundEnabled,
            onCellBgChange,
            onMakeRowHeader,
            onUnsetRowHeader,
            onClearCellsClick,
            onInsertAfterClick,
            onInsertBeforeClick,
            onRemoveRangeClick,
            onRemoveTableClick,
        ]);

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

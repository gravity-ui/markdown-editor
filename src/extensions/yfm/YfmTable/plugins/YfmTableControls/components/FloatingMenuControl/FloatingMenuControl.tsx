import {useMemo} from 'react';

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

export type FloatingMenuControlProps = {
    acnhorElement: Element;
    multiple: boolean;
    type: FloatingMenuProps['dirtype'];
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
        acnhorElement,
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

        return (
            <FloatingMenu
                dirtype={type}
                canDrag={dndHandler ? dndHandler.canDrag() : false}
                onOpenToggle={onMenuOpenToggle}
                anchorElement={acnhorElement}
                switcherMouseProps={
                    dndHandler
                        ? {
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

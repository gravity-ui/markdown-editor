import {Ellipsis} from '@gravity-ui/icons';
import {DropdownMenu, type DropdownMenuItemMixed, Icon, Popup} from '@gravity-ui/uikit';

import type {Action} from '../../../../../core';

import './floating.scss';

export type TableCellFloatingButtonAction = {action: Action<Record<string, unknown>>; text: string};
export type TableCellFloatingButtonMixed =
    | TableCellFloatingButtonAction
    | TableCellFloatingButtonAction[];
export type TableCellFloatingButtonActions = TableCellFloatingButtonMixed[];

export type TableCellFloatingButtonProps = {
    dom?: Element;
    actions: TableCellFloatingButtonActions;
};

export const TableCellFloatingButton: React.FC<TableCellFloatingButtonProps> = ({dom, actions}) => {
    if (!dom) {
        return null;
    }

    return (
        <Popup
            open
            keepMounted={false}
            hasArrow={false}
            anchorElement={dom}
            offset={{crossAxis: 2, mainAxis: -12}}
            placement="left-start"
        >
            <DropdownMenu
                icon={<Icon data={Ellipsis} size={12} className="table-cell-floating-icon" />}
                defaultSwitcherClassName="table-cell-floating-button"
                items={actions.map(buildMenuItem)}
            />
        </Popup>
    );
};
TableCellFloatingButton.displayName = 'TableCellFloatingButton';

function buildMenuItem(floatingAction: TableCellFloatingButtonMixed): DropdownMenuItemMixed<never> {
    if (Array.isArray(floatingAction)) {
        // @ts-expect-error
        return floatingAction.map(buildMenuItem);
    }

    const {action, text} = floatingAction;
    const active = action.isActive();
    const disabled = !active && !action.isEnable();

    return {
        text,
        action: () => action.run({}),
        active,
        disabled,
    };
}

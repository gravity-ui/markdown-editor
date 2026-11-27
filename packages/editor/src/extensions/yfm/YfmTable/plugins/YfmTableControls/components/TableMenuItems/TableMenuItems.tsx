import {
    ArrowShapeRightFromLine as AddColumnAfterIcon,
    ArrowShapeLeftFromLine as AddColumnBeforeIcon,
    ArrowShapeDownFromLine as AddRowAfterIcon,
    ArrowShapeUpFromLine as AddRowBeforeIcon,
    BroomMotion as ClearCellsIcon,
    Xmark as RemoveRangeIcon,
    TrashBin as RemoveTableIcon,
} from '@gravity-ui/icons';
import {DropdownMenu, Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-table';

type Axis = 'row' | 'column';
type InsertMenuItemsProps = {
    type: Axis;
    onClick: (position: 'before' | 'after') => void;
};
type ClearMenuItemProps = {
    onClick: () => void;
};
type RemoveMenuItemProps = {
    type: Axis | 'table';
    multiple?: boolean;
    onClick: () => void;
};

const insertIcons = {
    row: {before: AddRowBeforeIcon, after: AddRowAfterIcon},
    column: {before: AddColumnBeforeIcon, after: AddColumnAfterIcon},
} as const;
const sides = ['before', 'after'] as const;

export function InsertMenuItems({type, onClick}: InsertMenuItemsProps) {
    return sides.map((side) => (
        <DropdownMenu.Item
            key={side}
            qa={`g-md-yfm-table-action-add-${type}-${side}`}
            iconStart={<Icon data={insertIcons[type][side]} />}
            text={i18n(`${type}.add.${side}`)}
            action={() => onClick(side)}
        />
    ));
}

export function ClearMenuItem({onClick}: ClearMenuItemProps) {
    return (
        <DropdownMenu.Item
            qa="g-md-yfm-table-action-clear-cells"
            iconStart={<Icon data={ClearCellsIcon} />}
            text={i18n('cells.clear')}
            action={onClick}
        />
    );
}

export function RemoveMenuItem({type, multiple, onClick}: RemoveMenuItemProps) {
    return (
        <DropdownMenu.Item
            qa={`g-md-yfm-table-action-remove-${type}`}
            theme={type === 'table' ? 'danger' : undefined}
            iconStart={<Icon data={type === 'table' ? RemoveTableIcon : RemoveRangeIcon} />}
            text={
                type === 'table'
                    ? i18n('table.remove')
                    : i18n(`${type}.remove${multiple ? '.multiple' : ''}`)
            }
            action={onClick}
        />
    );
}

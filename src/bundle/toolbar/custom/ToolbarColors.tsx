import React from 'react';

import {cn} from '../../../classname';
import {Colors} from '../../../extensions';
import {i18n} from '../../../i18n/menubar';
import {ToolbarBaseProps} from '../../../toolbar';
import {icons} from '../../config/icons';
import {ToolbarButtonWithPopupMenu} from '../ToolbarButtonWithPopupMenu';

import './ToolbarColors.scss';

const b = cn('toolbar-colors');
const textColorIcon = icons.textColor;

export type ToolbarColorsProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    active?: boolean;
    enable?: boolean;
    currentColor?: string;
    exec(color: string): void;
};

export const ToolbarColors: React.FC<ToolbarColorsProps> = (props) => {
    const {exec, onClick, enable, currentColor} = props;
    const onItemClick = (color: string) => () => {
        exec(color);
        onClick?.('colorify', {color});
    };

    const items = [
        Colors.Black,
        Colors.Gray,
        Colors.Yellow,
        Colors.Orange,
        Colors.Red,
        Colors.Green,
        Colors.Blue,
        Colors.Violet,
    ].map((color) => ({
        id: color,
        icon: textColorIcon.data,
        size: textColorIcon.size ?? 16,
        text: i18n(`colorify__color_${color}`),
        iconClassname: b('item-icon', {color}),
        action: {
            run: onItemClick(color),
            isEnable: () => Boolean(enable),
            isActive: () => color === currentColor,
            meta() {},
        },
        group: i18n(`colorify__group_text`),
    }));

    return (
        <ToolbarButtonWithPopupMenu
            {...props}
            title={i18n('colorify')}
            menuItems={items}
            icon={textColorIcon}
        />
    );
};

import React from 'react';

import {cn} from '../../../classname';
import {Colors} from '../../../extensions';
import {i18n} from '../../../i18n/menubar';
import {ToolbarBaseProps} from '../../../toolbar';
import {icons} from '../../config/icons';
import {MenuItem, ToolbarButtonWithPopupMenu} from '../ToolbarButtonWithPopupMenu';

import './ToolbarColors.scss';

const b = cn('toolbar-colors');
const textColorIcon = icons.textColor;

export type ToolbarColorsProps = Omit<ToolbarBaseProps<never>, 'editor'> & {
    active?: boolean;
    enable?: boolean;
    currentColor?: string;
    withDefault?: boolean;
    exec(color: string): void;
};

export const ToolbarColors: React.FC<ToolbarColorsProps> = (props) => {
    const {exec, onClick, enable, currentColor, withDefault} = props;
    const isDefault = currentColor === undefined;

    const onItemClick = (color: string) => () => {
        // do not exec when current color is default and clicked to default item
        if (!(isDefault && color === '')) exec(color);
        onClick?.('colorify', {color: color === '' ? 'default' : color});
    };

    const items = [
        Colors.Gray,
        Colors.Yellow,
        Colors.Orange,
        Colors.Red,
        Colors.Green,
        Colors.Blue,
        Colors.Violet,
    ].map<MenuItem>((color) => ({
        id: color,
        icon: textColorIcon.data,
        iconSize: textColorIcon.size ?? 16,
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

    if (withDefault) {
        items.unshift({
            id: 'default',
            icon: textColorIcon.data,
            iconSize: textColorIcon.size ?? 16,
            text: i18n(`colorify__color_default`),
            iconClassname: b('item-icon', {color: 'default'}),
            group: i18n(`colorify__group_text`),
            ignoreActive: true,
            action: {
                run: onItemClick(''),
                isEnable: () => Boolean(enable),
                isActive: () => isDefault,
                meta() {},
            },
        });
    }

    return (
        <ToolbarButtonWithPopupMenu
            {...props}
            title={i18n('colorify')}
            menuItems={items}
            icon={textColorIcon}
            iconClassName={b('menu-icon', {color: currentColor})}
        />
    );
};

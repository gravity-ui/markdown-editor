import {useEffect, useMemo} from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    Icon,
    type IconProps,
    Menu,
    Popup,
    type PopupProps,
} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import type {Action} from '../../core';
import {groupBy, isFunction} from '../../lodash';
import {useBooleanState, useElementState} from '../../react-utils/hooks';
import {type ToolbarBaseProps, type ToolbarIconData, ToolbarTooltipDelay} from '../../toolbar';

import './ToolbarButtonWithPopupMenu.scss';
const b = cn('toolbar-button-with-popup-menu');

export type MenuItem = {
    id: string;
    action: Action;
    icon: IconProps['data'];
    text: string;
    iconSize?: IconProps['size'];
    iconClassname?: string;
    group?: string;
    ignoreActive?: boolean;
};

export type ToolbarButtonWithPopupMenuProps = Omit<
    ToolbarBaseProps<never> &
        Pick<PopupProps, 'disablePortal'> & {
            icon: ToolbarIconData;
            iconClassName?: string;
            chevronIconClassName?: string;
            title: string | (() => string);
            menuItems: MenuItem[];
            /** @default 'classic' */
            _selectionType?: 'classic' | 'light';
            qaMenu?: string;
        },
    'editor'
>;

export const ToolbarButtonWithPopupMenu: React.FC<ToolbarButtonWithPopupMenuProps> = ({
    disablePortal,
    className,
    focus,
    onClick,
    icon,
    iconClassName,
    chevronIconClassName,
    title,
    menuItems,
    _selectionType,
    qa,
    qaMenu,
    ...props
}) => {
    const [anchorElement, setAnchorElement] = useElementState();
    const [open, , hide, toggleOpen] = useBooleanState(false);
    const groups = useMemo(
        () =>
            groupBy(
                menuItems.map((i) => ({...i, group: i.group || ''})),
                'group',
            ),
        [menuItems],
    );

    const someActive = menuItems.some(
        (item) => !item.ignoreActive && item.action.isActive() === true,
    );
    const everyDisabled = menuItems.every((item) => item.action.isEnable() === false);

    const popupOpen = everyDisabled ? false : open;
    const shouldForceHide = open && !popupOpen;
    useEffect(() => {
        if (shouldForceHide) {
            hide();
        }
    }, [hide, shouldForceHide]);

    const [btnView, btnSelected] =
        _selectionType === 'light'
            ? ([
                  popupOpen ? 'normal' : someActive ? 'flat-action' : 'flat',
                  popupOpen && someActive,
              ] as const)
            : ([someActive || popupOpen ? 'normal' : 'flat', someActive] as const);

    const textTitle = isFunction(title) ? title() : title;

    return (
        <>
            <ActionTooltip
                disabled={popupOpen}
                openDelay={ToolbarTooltipDelay.Open}
                closeDelay={ToolbarTooltipDelay.Close}
                title={textTitle}
            >
                <Button
                    size="m"
                    ref={setAnchorElement}
                    view={btnView}
                    selected={btnSelected}
                    disabled={everyDisabled}
                    className={b(null, [className])}
                    onClick={toggleOpen}
                    aria-label={textTitle}
                    qa={qa}
                    {...props}
                >
                    <Icon data={icon.data} size={icon.size} className={iconClassName} />
                    {''}
                    <Icon data={ChevronDown} className={chevronIconClassName} />
                </Button>
            </ActionTooltip>
            <Popup
                open={popupOpen}
                disablePortal={disablePortal}
                anchorElement={anchorElement}
                onOpenChange={(open) => {
                    if (!open) hide();
                }}
            >
                <Menu size="l" qa={qaMenu}>
                    {Object.entries(groups).map(([label, items], key) => {
                        return (
                            <Menu.Group label={label} key={key} className={b('menu-group')}>
                                {items.map(
                                    ({id, icon, iconSize = 16, action, text, iconClassname}) => (
                                        <Menu.Item
                                            key={id}
                                            iconStart={
                                                <Icon
                                                    data={icon}
                                                    size={iconSize}
                                                    className={iconClassname}
                                                />
                                            }
                                            active={action.isActive()}
                                            disabled={!action.isEnable()}
                                            onClick={() => {
                                                hide();
                                                focus();
                                                action.run();
                                                onClick?.(id);
                                            }}
                                            extraProps={{'aria-label': text}}
                                        >
                                            {text}
                                        </Menu.Item>
                                    ),
                                )}
                            </Menu.Group>
                        );
                    })}
                </Menu>
            </Popup>
        </>
    );
};

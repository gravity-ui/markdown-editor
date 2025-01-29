import {useEffect, useMemo} from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon, IconProps, Menu, Popup, PopupProps} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import {Action, ActionStorage} from '../../core';
import {groupBy, isFunction} from '../../lodash';
import {useBooleanState, useElementState} from '../../react-utils/hooks';
import {ToolbarBaseProps, ToolbarIconData, ToolbarTooltipDelay} from '../../toolbar';

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
    ToolbarBaseProps<ActionStorage> &
        Pick<PopupProps, 'disablePortal'> & {
            icon: ToolbarIconData;
            iconClassName?: string;
            chevronIconClassName?: string;
            title: string | (() => string);
            menuItems: MenuItem[];
            /** @default 'classic' */
            _selectionType?: 'classic' | 'light';
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

    return (
        <>
            <ActionTooltip
                disabled={popupOpen}
                openDelay={ToolbarTooltipDelay.Open}
                closeDelay={ToolbarTooltipDelay.Close}
                title={isFunction(title) ? title() : title}
            >
                <Button
                    size="m"
                    ref={setAnchorElement}
                    view={btnView}
                    selected={btnSelected}
                    disabled={everyDisabled}
                    className={b(null, [className])}
                    onClick={toggleOpen}
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
                <Menu size="l">
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

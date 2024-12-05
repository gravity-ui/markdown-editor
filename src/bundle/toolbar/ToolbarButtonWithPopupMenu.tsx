import React from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon, IconProps, Menu, Popup} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import {Action, ActionStorage} from '../../core';
import {groupBy, isFunction} from '../../lodash';
import {useBooleanState} from '../../react-utils/hooks';
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
    ToolbarBaseProps<ActionStorage> & {
        icon: ToolbarIconData;
        iconClassName?: string;
        chevronIconClassName?: string;
        title: string | (() => string);
        menuItems: MenuItem[];
    },
    'editor'
>;

export const ToolbarButtonWithPopupMenu: React.FC<ToolbarButtonWithPopupMenuProps> = ({
    className,
    focus,
    onClick,
    icon,
    iconClassName,
    chevronIconClassName,
    title,
    menuItems,
}) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [open, , hide, toggleOpen] = useBooleanState(false);
    const groups = React.useMemo(
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
    React.useEffect(() => {
        if (shouldForceHide) {
            hide();
        }
    }, [hide, shouldForceHide]);

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
                    ref={buttonRef}
                    view={someActive || popupOpen ? 'normal' : 'flat'}
                    selected={someActive}
                    disabled={everyDisabled}
                    className={b(null, [className])}
                    onClick={toggleOpen}
                >
                    <Icon data={icon.data} size={icon.size} className={iconClassName} />
                    {''}
                    <Icon data={ChevronDown} className={chevronIconClassName} />
                </Button>
            </ActionTooltip>
            <Popup anchorRef={buttonRef} open={popupOpen} onClose={hide}>
                <Menu size="l">
                    {Object.entries(groups).map(([label, items], key) => {
                        return (
                            <Menu.Group label={label} key={key} className={b('menu-group')}>
                                {items.map(
                                    ({id, icon, iconSize = 16, action, text, iconClassname}) => (
                                        <Menu.Item
                                            key={id}
                                            icon={
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

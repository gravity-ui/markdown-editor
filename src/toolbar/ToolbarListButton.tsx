import React from 'react';
import isFunction from 'lodash/isFunction';
import {Button, Hotkey, Icon, Menu, Popup, Tooltip} from '@gravity-ui/uikit';
import {HelpPopover} from '@gravity-ui/components';
import {ChevronDown} from '@gravity-ui/icons';

import {cn} from '../classname';
import {useBooleanState} from '../react-utils/hooks';
import {ToolbarTooltipDelay} from './const';
import {ToolbarBaseProps, ToolbarIconData, ToolbarItemData} from './types';

import './ToolbarListButton.scss';

const b = cn('toolbar-list-button');

export type ToolbarListButtonData<E> = {
    icon: ToolbarIconData;
    title: string | (() => string);
    withArrow?: boolean;
    data: ToolbarItemData<E>[];
    alwaysActive?: boolean;
    hideDisabled?: boolean;
};

export type ToolbarListButtonProps<E> = ToolbarBaseProps<E> & ToolbarListButtonData<E>;

export function ToolbarListButton<E>({
    className,
    editor,
    focus,
    onClick,
    icon,
    title,
    withArrow,
    data,
    alwaysActive,
    hideDisabled,
}: ToolbarListButtonProps<E>) {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [open, , hide, toggleOpen] = useBooleanState(false);

    const someActive = alwaysActive ? false : data.some((item) => item.isActive(editor));
    const everyDisabled = alwaysActive ? false : data.every((item) => !item.isEnable(editor));

    const popupOpen = everyDisabled ? false : open;
    const shouldForceHide = open && !popupOpen;
    React.useEffect(() => {
        if (shouldForceHide) {
            hide();
        }
    }, [hide, shouldForceHide]);

    if (data.length === 0) return null;

    const buttonContent = [<Icon key={1} data={icon.data} size={icon.size ?? 16} />];
    if (withArrow) {
        buttonContent.push(<React.Fragment key={2}>{''}</React.Fragment>);
        buttonContent.push(<Icon key={3} data={ChevronDown} size={16} />);
    }

    const titleText: string = isFunction(title) ? title() : title;

    return (
        <>
            <Tooltip
                content={titleText}
                disabled={popupOpen}
                openDelay={ToolbarTooltipDelay.Open}
                closeDelay={ToolbarTooltipDelay.Close}
            >
                <Button
                    size="m"
                    ref={buttonRef}
                    view={someActive || popupOpen ? 'normal' : 'flat'}
                    selected={someActive}
                    disabled={everyDisabled}
                    className={b({arrow: withArrow}, [className])}
                    onClick={toggleOpen}
                >
                    {buttonContent}
                </Button>
            </Tooltip>
            <Popup anchorRef={buttonRef} open={popupOpen} onClose={hide}>
                <Menu size="l" className={b('menu')}>
                    {data
                        .map(({id, title, icon, hotkey, isActive, isEnable, exec, hint}) => {
                            const titleText = isFunction(title) ? title() : title;
                            const hintText = isFunction(hint) ? hint() : hint;
                            const disabled = !isEnable(editor);
                            return hideDisabled && disabled ? null : (
                                <Menu.Item
                                    key={id}
                                    active={isActive(editor)}
                                    disabled={!isEnable(editor)}
                                    onClick={() => {
                                        hide();
                                        focus();
                                        exec(editor);
                                        onClick?.(id);
                                    }}
                                    icon={<Icon data={icon.data} size={icon.size ?? 16} />}
                                    extraProps={{'aria-label': titleText}}
                                >
                                    <div className={b('item')}>
                                        {titleText}
                                        <div className={b('extra')}>
                                            {hotkey && <Hotkey value={hotkey} />}
                                            {hintText && (
                                                <HelpPopover
                                                    className={b('hint')}
                                                    content={hintText}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </Menu.Item>
                            );
                        })
                        .filter(Boolean)}
                </Menu>
            </Popup>
        </>
    );
}

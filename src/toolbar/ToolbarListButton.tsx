import React from 'react';
import {isFunction} from 'lodash';
import {Button, HelpPopover, Icon, Menu, Popup, Tooltip} from '@gravity-ui/uikit';

import chevronIcon from '../../assets/icons/ye-chevron.svg';
import {cn} from '../classname';
import {useBooleanState} from '../react-utils/hooks';
import {ToolbarBaseProps, ToolbarIconData, ToolbarItemData} from './types';

import './ToolbarListButton.scss';

const b = cn('toolbar-list-button');

export type ToolbarListButtonData<E> = {
    icon: ToolbarIconData;
    title: string | (() => string);
    withArrow?: boolean;
    data: ToolbarItemData<E>[];
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
}: ToolbarListButtonProps<E>) {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [open, , hide, toggleOpen] = useBooleanState(false);

    const someActive = data.some((item) => item.isActive(editor));
    const everyDisabled = data.every((item) => !item.isEnable(editor));

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
        buttonContent.push(<Icon key={3} data={chevronIcon} size={16} />);
    }

    const titleText: string = isFunction(title) ? title() : title;

    return (
        <>
            <Tooltip content={titleText} disabled={popupOpen}>
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
                    {data.map(({id, title, icon, hotkey, isActive, isEnable, exec, hint}) => {
                        const titleText = isFunction(title) ? title() : title;
                        const hintText = isFunction(hint) ? hint() : hint;
                        return (
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
                                        {hotkey && <div className={b('hotkey')}>{hotkey}</div>}
                                        {hintText && (
                                            <HelpPopover className={b('hint')} content={hintText} />
                                        )}
                                    </div>
                                </div>
                            </Menu.Item>
                        );
                    })}
                </Menu>
            </Popup>
        </>
    );
}

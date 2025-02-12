import {Fragment, useEffect, useState} from 'react';

import {ChevronDown} from '@gravity-ui/icons';
import {
    ActionTooltip,
    Button,
    HelpMark,
    Hotkey,
    Icon,
    Menu,
    Popover,
    Popup,
} from '@gravity-ui/uikit';

import {cn} from '../classname';
import {i18n} from '../i18n/common';
import {isFunction} from '../lodash';
import {useBooleanState, useElementState} from '../react-utils/hooks';

import {PreviewTooltip} from './PreviewTooltip';
import {ToolbarTooltipDelay} from './const';
import type {
    ToolbarBaseProps,
    ToolbarButtonPopupData,
    ToolbarItemData,
    ToolbarListButtonData,
} from './types';

import './ToolbarListButton.scss';

const b = cn('toolbar-list-button');

export type {ToolbarListButtonData};

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
}: ToolbarListButtonProps<E>) {
    const [anchorElement, setAnchorElement] = useElementState();
    const [open, , hide, toggleOpen] = useBooleanState(false);
    const [popupItem, setPopupItem] = useState<ToolbarButtonPopupData<E>>();

    const someActive = alwaysActive
        ? false
        : data.some((item) => item.isActive(editor) && !item.doNotActivateList);
    const everyDisabled = alwaysActive ? false : data.every((item) => !item.isEnable(editor));

    const popupOpen = everyDisabled ? false : open;
    const shouldForceHide = open && !popupOpen;
    useEffect(() => {
        if (shouldForceHide) {
            hide();
        }
    }, [hide, shouldForceHide]);

    if (data.length === 0) return null;

    const buttonContent = [<Icon key={1} data={icon.data} size={icon.size ?? 16} />];
    if (withArrow) {
        buttonContent.push(<Fragment key={2}>{''}</Fragment>);
        buttonContent.push(<Icon key={3} data={ChevronDown} size={16} />);
    }

    const titleText: string = isFunction(title) ? title() : title;

    return (
        <>
            <Popover
                className={b('action-disabled-popover')}
                content={
                    <div className={b('action-disabled-tooltip')}>
                        {i18n('toolbar_action_disabled')}
                    </div>
                }
                placement={'bottom'}
                disabled={!everyDisabled}
            >
                <ActionTooltip
                    title={titleText}
                    disabled={Boolean(popupItem) || popupOpen}
                    openDelay={ToolbarTooltipDelay.Open}
                    closeDelay={ToolbarTooltipDelay.Close}
                >
                    <Button
                        size="m"
                        ref={setAnchorElement}
                        view={someActive || popupOpen ? 'normal' : 'flat'}
                        selected={someActive}
                        disabled={everyDisabled}
                        className={b({arrow: withArrow}, [className])}
                        onClick={() => {
                            if (popupItem) setPopupItem(undefined);
                            else toggleOpen();
                        }}
                    >
                        {buttonContent}
                    </Button>
                </ActionTooltip>
            </Popover>
            <Popup anchorElement={anchorElement} open={popupOpen} onOpenChange={hide}>
                <Menu size="l" className={b('menu')}>
                    {data
                        .map((data) => {
                            const {
                                id,
                                title,
                                icon,
                                hotkey,
                                isActive,
                                isEnable,
                                exec,
                                hint,
                                hintWhenDisabled,
                                preview,
                            } = data;

                            const titleText = isFunction(title) ? title() : title;
                            const hintText = isFunction(hint) ? hint() : hint;

                            const disabled = !isEnable(editor);

                            const hideHintWhenDisabled = hintWhenDisabled === false || !disabled;
                            const hintWhenDisabledText =
                                typeof hintWhenDisabled === 'string'
                                    ? hintWhenDisabled
                                    : typeof hintWhenDisabled === 'function'
                                      ? hintWhenDisabled()
                                      : i18n('toolbar_action_disabled');

                            const handleClick = () => {
                                hide();

                                if (isPopupItem(data)) {
                                    setPopupItem(data);
                                } else {
                                    setPopupItem(undefined);
                                    focus();
                                    exec(editor);
                                    onClick?.(id);
                                }
                            };

                            return (
                                <Popover
                                    className={b('action-disabled-popover')}
                                    content={
                                        <div className={b('action-disabled-tooltip')}>
                                            {hintWhenDisabledText}
                                        </div>
                                    }
                                    placement="left"
                                    modal={false}
                                    disabled={hideHintWhenDisabled}
                                    key={id}
                                >
                                    {(props, ref) => (
                                        <PreviewTooltip preview={preview}>
                                            <Menu.Item
                                                key={id}
                                                ref={ref}
                                                active={isActive(editor)}
                                                disabled={!isEnable(editor)}
                                                onClick={handleClick}
                                                iconStart={
                                                    <Icon data={icon.data} size={icon.size ?? 16} />
                                                }
                                                extraProps={{
                                                    ...props,
                                                    'aria-label': titleText,
                                                }}
                                            >
                                                <div className={b('item')}>
                                                    {titleText}
                                                    <div className={b('extra')}>
                                                        {hotkey && <Hotkey value={hotkey} />}
                                                        {hintText && (
                                                            <HelpMark
                                                                className={b('hint')}
                                                                popoverProps={{modal: false}}
                                                            >
                                                                {hintText}
                                                            </HelpMark>
                                                        )}
                                                    </div>
                                                </div>
                                            </Menu.Item>
                                        </PreviewTooltip>
                                    )}
                                </Popover>
                            );
                        })
                        .filter(Boolean)}
                </Menu>
            </Popup>
            {popupItem
                ? popupItem.renderPopup({
                      ...popupItem,
                      editor,
                      focus,
                      onClick,
                      anchorElement,
                      hide: () => setPopupItem(undefined),
                  })
                : null}
        </>
    );
}

function isPopupItem<E>(item: ToolbarItemData<E>): item is ToolbarButtonPopupData<E> {
    return Boolean((item as ToolbarButtonPopupData<E>).renderPopup);
}

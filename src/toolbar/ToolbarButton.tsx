import React, {useRef} from 'react';

import {ActionTooltip, Button, Icon, Popover} from '@gravity-ui/uikit';
import isFunction from 'lodash/isFunction';

import {cn} from '../classname';
import {i18n} from '../i18n/common';

import {ToolbarTooltipDelay} from './const';
import type {ToolbarBaseProps, ToolbarItemData} from './types';

import './ToolbarButton.scss';

const b = cn('toolbar-button');

export type ToolbarButtonProps<E> = ToolbarBaseProps<E> & ToolbarItemData<E>;

export function ToolbarButton<E>({
    className,
    id,
    title,
    hotkey,
    editor,
    icon,
    disabledPopoverVisible = true,
    hintWhenDisabled,
    exec,
    focus,
    onClick,
    isActive,
    isEnable,
}: ToolbarButtonProps<E>) {
    const active = isActive(editor);
    const enabled = isEnable(editor);
    const disabled = !active && !enabled;
    const buttonRef = useRef<HTMLElement>(null);

    const titleText: string = isFunction(title) ? title() : title;
    const hideHintWhenDisabled = hintWhenDisabled === false || !disabledPopoverVisible || !disabled;
    const hintWhenDisabledText =
        typeof hintWhenDisabled === 'string'
            ? hintWhenDisabled
            : typeof hintWhenDisabled === 'function'
              ? hintWhenDisabled()
              : i18n('toolbar_action_disabled');

    return (
        <Popover
            content={hintWhenDisabledText}
            disabled={hideHintWhenDisabled}
            tooltipContentClassName={b('action-disabled-tooltip')}
            placement={['bottom']}
        >
            <ActionTooltip
                openDelay={ToolbarTooltipDelay.Open}
                closeDelay={ToolbarTooltipDelay.Close}
                title={titleText}
                hotkey={hotkey}
            >
                <Button
                    ref={buttonRef}
                    size="m"
                    selected={active}
                    disabled={disabled}
                    view={active ? 'normal' : 'flat'}
                    onClick={() => {
                        focus();
                        exec(editor);
                        onClick?.(id);
                    }}
                    className={b(null, [className])}
                    extraProps={{'aria-label': titleText}}
                >
                    <Icon data={icon.data} size={icon.size ?? 16} />
                </Button>
            </ActionTooltip>
        </Popover>
    );
}

import React from 'react';
import {isFunction} from 'lodash';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';
import {cn} from '../classname';
import {ToolbarTooltipDelay} from './const';
import type {ToolbarBaseProps, ToolbarItemData} from './types';

const b = cn('toolbar-button');

export type ToolbarButtonProps<E> = ToolbarBaseProps<E> & ToolbarItemData<E>;

export function ToolbarButton<E>({
    className,
    id,
    title,
    hotkey,
    editor,
    icon,
    exec,
    focus,
    onClick,
    isActive,
    isEnable,
}: ToolbarButtonProps<E>) {
    const active = isActive(editor);
    const enabled = isEnable(editor);
    const disabled = !active && !enabled;

    const titleText: string = isFunction(title) ? title() : title;

    return (
        <ActionTooltip
            openDelay={ToolbarTooltipDelay.Open}
            closeDelay={ToolbarTooltipDelay.Close}
            title={titleText}
            hotkey={hotkey}
        >
            <Button
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
    );
}

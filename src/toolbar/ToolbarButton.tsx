import {forwardRef} from 'react';

import {ActionTooltip, Button, Icon, Popover} from '@gravity-ui/uikit';

import {cn} from '../classname';
import {i18n} from '../i18n/common';
import {isFunction} from '../lodash';

import {ToolbarTooltipDelay} from './const';
import type {ToolbarBaseProps, ToolbarItemData} from './types';

import './ToolbarButton.scss';

const b = cn('toolbar-button');

export type ToolbarButtonProps<E> = ToolbarBaseProps<E> & ToolbarItemData<E>;

export type ToolbarButtonViewProps = Pick<
    ToolbarItemData<unknown>,
    'icon' | 'title' | 'hint' | 'hotkey' | 'hintWhenDisabled'
> & {
    active: boolean;
    enabled: boolean;
    onClick: () => void;
    className?: string;
};

export const ToolbarButtonView = forwardRef<HTMLElement, ToolbarButtonViewProps>(
    function ToolbarButtonView(
        {icon, title, hint, hotkey, hintWhenDisabled, active, enabled, onClick, className},
        ref,
    ) {
        const disabled = !active && !enabled;
        const titleText: string = isFunction(title) ? title() : title;
        const hintText: string | undefined = isFunction(hint) ? hint() : hint;
        const hideHintWhenDisabled = hintWhenDisabled === false || !disabled;
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
                    description={hintText}
                    title={titleText}
                    hotkey={hotkey}
                >
                    <Button
                        size="m"
                        ref={ref}
                        selected={active}
                        disabled={disabled}
                        view={active ? 'normal' : 'flat'}
                        onClick={onClick}
                        className={b(null, [className])}
                        extraProps={{'aria-label': titleText}}
                    >
                        <Icon data={icon.data} size={icon.size ?? 16} />
                    </Button>
                </ActionTooltip>
            </Popover>
        );
    },
);

export function ToolbarButton<E>(props: ToolbarButtonProps<E>) {
    const {id, editor, focus, isActive, isEnable, exec, onClick} = props;

    const active = isActive(editor);
    const enabled = isEnable(editor);

    return (
        <ToolbarButtonView
            {...props}
            active={active}
            enabled={enabled}
            onClick={() => {
                focus();
                exec(editor);
                onClick?.(id);
            }}
        />
    );
}

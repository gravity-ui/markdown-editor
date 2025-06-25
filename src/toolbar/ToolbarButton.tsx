import {type ReactNode, forwardRef} from 'react';

import {ActionTooltip, Button, Icon, Popover, setRef} from '@gravity-ui/uikit';

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
    'title' | 'hint' | 'hotkey' | 'hintWhenDisabled' | 'qa'
> & {
    active: boolean;
    enabled: boolean;
    onClick: () => void;
    id?: string;
    className?: string;
    mobile?: boolean;
} & (Pick<ToolbarItemData<unknown>, 'icon'> | {children: ReactNode});

const DEFAULT_ICON_SIZE = 16;

export const ToolbarButtonView = forwardRef<HTMLButtonElement, ToolbarButtonViewProps>(
    function ToolbarButtonView(
        {
            title,
            hint,
            hotkey,
            hintWhenDisabled,
            active,
            enabled,
            onClick,
            className,
            qa,
            mobile,
            id,
            ...props
        },
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
                content={<div className={b('action-disabled-tooltip')}>{hintWhenDisabledText}</div>}
                disabled={hideHintWhenDisabled}
                placement={['bottom']}
            >
                {(_, refForPopover) => (
                    <ActionTooltip
                        openDelay={ToolbarTooltipDelay.Open}
                        closeDelay={ToolbarTooltipDelay.Close}
                        description={hintText}
                        title={titleText}
                        hotkey={hotkey}
                        disabled={mobile}
                    >
                        {(__, refForTooltip) => (
                            <Button
                                qa={qa}
                                size="m"
                                ref={(elem: HTMLButtonElement) => {
                                    setRef(ref, elem);
                                    setRef(refForPopover, elem);
                                    setRef(refForTooltip, elem);
                                }}
                                selected={active}
                                disabled={disabled}
                                view={active ? 'normal' : 'flat'}
                                onClick={onClick}
                                className={b(null, [className])}
                                aria-label={titleText}
                                data-toolbar-item={id}
                            >
                                {'icon' in props ? (
                                    <Icon
                                        data={props.icon.data}
                                        size={props.icon.size ?? DEFAULT_ICON_SIZE}
                                    />
                                ) : (
                                    props.children
                                )}
                            </Button>
                        )}
                    </ActionTooltip>
                )}
            </Popover>
        );
    },
);

export function ToolbarButton<E>(props: ToolbarButtonProps<E>) {
    const {id, editor, focus, isActive, isEnable, exec, onClick} = props;

    const active = isActive(editor);
    const enabled = isEnable(editor);

    const handleClick = () => {
        focus();
        exec(editor);
        onClick?.(id);
    };

    return <ToolbarButtonView {...props} active={active} enabled={enabled} onClick={handleClick} />;
}

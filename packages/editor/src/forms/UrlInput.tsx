import type {ReactNode} from 'react';

import {
    ActionTooltip,
    Button,
    type ButtonProps,
    Icon,
    type IconProps,
    type TextInputProps,
} from '@gravity-ui/uikit';

import {cn} from '../classname';
import {enterKeyHandler} from '../utils/handlers';

import {TextInputFixed} from './TextInput';

import './UrlInput.scss';

const b = cn('url-input');

export type UrlInputProps = {
    value: string;
    onUpdate: (value: string) => void;
    onSubmit?: () => void;
    'aria-label': string;
    actions?: ReactNode;
} & Pick<
    TextInputProps,
    'autoFocus' | 'placeholder' | 'disabled' | 'readOnly' | 'onBlur' | 'onKeyDown' | 'className'
>;

export function UrlInput({
    value,
    onUpdate,
    onSubmit,
    'aria-label': ariaLabel,
    actions,
    className,
    onKeyDown,
    ...inputProps
}: UrlInputProps) {
    const submit = enterKeyHandler(() => onSubmit?.());

    return (
        <div className={b(null, className)}>
            <TextInputFixed
                {...inputProps}
                size="l"
                hasClear={!inputProps.readOnly}
                view="clear"
                value={value}
                className={b('input', {actions: Boolean(actions)})}
                onUpdate={onUpdate}
                controlProps={{'aria-label': ariaLabel}}
                onKeyDown={(event) => {
                    onKeyDown?.(event);
                    if (!event.defaultPrevented && !inputProps.disabled && !inputProps.readOnly)
                        submit(event);
                }}
            />
            {actions}
        </div>
    );
}

export type UrlActionProps = {
    title: string;
    icon: IconProps['data'];
    onClick?: () => void;
} & Pick<ButtonProps, 'href' | 'disabled' | 'loading'>;

export function UrlAction({title, icon, href, ...buttonProps}: UrlActionProps) {
    return (
        <ActionTooltip title={title}>
            <Button
                {...buttonProps}
                className={b('button')}
                view="flat"
                size="m"
                aria-label={title}
                href={href}
                target={href ? '_blank' : undefined}
                rel={href ? 'noopener noreferrer' : undefined}
            >
                <Icon data={icon} size={16} />
            </Button>
        </ActionTooltip>
    );
}

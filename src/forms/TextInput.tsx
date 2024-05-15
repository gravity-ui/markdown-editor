import React from 'react';

import {
    TextAreaProps,
    TextArea as TextAreaUIKit,
    TextInputProps,
    TextInput as TextInputUIKit,
} from '@gravity-ui/uikit';
import {useEffectOnce} from 'react-use';

// TODO: remove after fix https://github.com/yandex-cloud/uikit/issues/133
export const TextInputFixed = React.forwardRef<HTMLSpanElement, TextInputProps>((props, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const controlRef = (props.controlRef as React.RefObject<HTMLInputElement>) ?? inputRef;

    useEffectOnce(() => {
        if (props.autoFocus) {
            setTimeout(() => {
                controlRef.current?.focus();
            }, 30);
        }
    });

    // eslint-disable-next-line jsx-a11y/no-autofocus
    return <TextInputUIKit ref={ref} {...props} controlRef={controlRef} autoFocus={false} />;
});

TextInputFixed.displayName = 'TextInputFixed';

// TODO: remove after fix https://github.com/yandex-cloud/uikit/issues/133
export const TextAreaFixed = React.forwardRef<HTMLSpanElement, TextAreaProps>((props, ref) => {
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const controlRef = (props.controlRef as React.RefObject<HTMLTextAreaElement>) ?? inputRef;

    useEffectOnce(() => {
        if (props.autoFocus) {
            setTimeout(() => {
                controlRef.current?.focus();
            }, 30);
        }
    });

    return <TextAreaUIKit ref={ref} {...props} controlRef={controlRef} autoFocus={false} />;
});

TextAreaFixed.displayName = 'TextInputFixed';

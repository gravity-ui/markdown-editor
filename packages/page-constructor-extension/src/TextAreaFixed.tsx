import {forwardRef, useRef} from 'react';

import {type TextAreaProps, TextArea as TextAreaUIKit} from '@gravity-ui/uikit';
import {useEffectOnce} from 'react-use';

export const TextAreaFixed = forwardRef<HTMLSpanElement, TextAreaProps>((props, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
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

TextAreaFixed.displayName = 'TextAreaFixed';

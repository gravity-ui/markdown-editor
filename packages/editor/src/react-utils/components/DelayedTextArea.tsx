//
// A component similar to DelayedTextInput from the @gravity-ui/components library
// https://github.com/gravity-ui/components/blob/c31e0b98ce866a8b42da93298c83f81dfb8459f7/src/components/DelayedTextInput/DelayedTextInput.tsx
//

import {forwardRef} from 'react';

import {TextArea, type TextAreaProps} from '@gravity-ui/uikit';

import {useDelayedValue} from '../hooks/useDelayedValue';

type DelayedTextAreaProps = Required<Pick<TextAreaProps, 'onUpdate' | 'value'>> &
    Omit<TextAreaProps, 'onUpdate' | 'defaultValue'> & {delay?: number};

function DelayedTextAreaComponent(props: DelayedTextAreaProps, ref: React.Ref<HTMLSpanElement>) {
    const {value, onUpdate, delay, ...textAreaProps} = props;

    const {currentValue: textInputValue, delayedOnChange} = useDelayedValue(value, onUpdate, delay);

    // Without this proxy "native" input clear will synchronize value only after specified delay.
    const onChangeProxy: DelayedTextAreaProps['onChange'] = (event) => {
        if (props.hasClear && event.type === 'click' && event.target.value === '') {
            textAreaProps.onChange?.(event);

            onUpdate('');
        }
    };

    return (
        <TextArea
            {...textAreaProps}
            ref={ref}
            onChange={onChangeProxy}
            value={textInputValue}
            onUpdate={delayedOnChange}
        />
    );
}

/***
 * Controlled textarea component. Property onUpdate is required in this component.
 */
export const DelayedTextArea = forwardRef(DelayedTextAreaComponent);

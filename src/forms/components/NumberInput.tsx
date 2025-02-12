import {TextInput, type TextInputProps} from '@gravity-ui/uikit';
import isNumber from 'is-number';

type BaseNumberInputProps = {
    value?: number;
    onUpdate: (value?: number) => void;
    min?: number;
    max?: number;
};

export type NumberInputProps = Omit<
    TextInputProps,
    keyof BaseNumberInputProps | 'type' | 'controlProps'
> &
    BaseNumberInputProps;

export const NumberInput: React.FC<NumberInputProps> = (props) => {
    const {value, onUpdate, min, max, ...textInputProps} = props;
    return (
        <TextInput
            value={isNumber(value) ? String(value) : ''}
            onUpdate={(v) => {
                if (isNumber(v)) {
                    onUpdate(parseInt(v, 10));
                } else {
                    onUpdate();
                }
            }}
            controlProps={{min, max}}
            type="number"
            {...textInputProps}
        />
    );
};

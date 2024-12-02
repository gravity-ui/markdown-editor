import {cn} from '../../../../classname';

export enum CheckboxNode {
    Checkbox = 'checkbox',
    Input = 'checkbox_input',
    Label = 'checkbox_label',
}

export const CheckboxAttr = {
    Class: 'class',
    Type: 'type',
    Id: 'id',
    Checked: 'checked',
    For: 'for',
} as const;

export const idPrefix = 'yfm-editor-checkbox';

export const b = cn('checkbox');

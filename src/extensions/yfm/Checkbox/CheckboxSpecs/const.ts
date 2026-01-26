import {cn} from '../../../../classname';
import {nodeTypeFactory} from '../../../../utils/schema';

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
    Line: 'data-line',
} as const;

export const idPrefix = 'yfm-editor-checkbox';

// TODO [MAJOR]: remove custom classname
export const b = cn('checkbox');

export const checkboxType = nodeTypeFactory(CheckboxNode.Checkbox);
export const checkboxLabelType = nodeTypeFactory(CheckboxNode.Label);
export const checkboxInputType = nodeTypeFactory(CheckboxNode.Input);

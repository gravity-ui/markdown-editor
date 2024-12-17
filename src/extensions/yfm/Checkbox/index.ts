import type {Action, ExtensionAuto} from '../../../core';
import {nodeInputRule} from '../../../utils/inputrules';

import {CheckboxSpecs, type CheckboxSpecsOptions} from './CheckboxSpecs';
import {addCheckbox} from './actions';
import {CheckboxInputView} from './nodeviews';
import {keymapPlugin} from './plugin';
import {fixPastePlugin} from './plugins/fix-paste';
import {checkboxInputType, checkboxType} from './utils';

import './index.scss';

const checkboxAction = 'addCheckbox';

export {
    CheckboxAttr,
    CheckboxNode,
    checkboxType,
    checkboxLabelType,
    checkboxInputType,
} from './CheckboxSpecs';

export type CheckboxOptions = Pick<CheckboxSpecsOptions, 'checkboxLabelPlaceholder'> & {};

export const Checkbox: ExtensionAuto<CheckboxOptions> = (builder, opts) => {
    builder.use(CheckboxSpecs, {
        ...opts,
        inputView: () => CheckboxInputView.create,
    });

    builder
        .addPlugin(keymapPlugin, builder.Priority.High)
        .addPlugin(fixPastePlugin)
        .addAction(checkboxAction, () => addCheckbox())
        .addInputRules(({schema}) => ({
            rules: [
                nodeInputRule(
                    /^\[(\s?)\]\s$/,
                    checkboxType(schema).createAndFill({}, checkboxInputType(schema).create()),
                    2,
                ),
            ],
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [checkboxAction]: Action;
        }
    }
}

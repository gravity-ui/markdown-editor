import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';

import {SubscriptSpecs, subscriptType} from './SubscriptSpecs';

export {subscriptMarkName, subscriptType} from './SubscriptSpecs';
const subAction = 'subscript';

export const Subscript: ExtensionAuto = (builder) => {
    builder.use(SubscriptSpecs);

    builder
        .addAction(subAction, ({schema}) => createToggleMarkAction(subscriptType(schema)))
        .addInputRules(({schema}) => ({
            rules: [
                markInputRule({open: '~', close: '~', ignoreBetween: '~'}, subscriptType(schema)),
            ],
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [subAction]: Action;
        }
    }
}

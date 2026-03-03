import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';

import {MonospaceSpecs, monospaceType} from './MonospaceSpecs';

export {monospaceMarkName, monospaceType} from './MonospaceSpecs';
const monoAction = 'mono';

export const Monospace: ExtensionAuto = (builder) => {
    builder.use(MonospaceSpecs);

    builder
        .addAction(monoAction, ({schema}) => createToggleMarkAction(monospaceType(schema)))
        .addInputRules(({schema}) => ({
            rules: [
                markInputRule({open: '##', close: '##', ignoreBetween: '#'}, monospaceType(schema)),
            ],
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [monoAction]: Action;
        }
    }
}

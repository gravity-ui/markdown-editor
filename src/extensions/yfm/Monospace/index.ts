import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';

import {MonospaceSpecs, monospaceMarkName, monospaceType} from './MonospaceSpecs';

export {monospaceMarkName, monospaceType} from './MonospaceSpecs';
/** @deprecated Use `monospaceMarkName` instead */
export const monospace = monospaceMarkName;
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
    namespace YfmEditor {
        interface Actions {
            [monoAction]: Action;
        }
    }
}

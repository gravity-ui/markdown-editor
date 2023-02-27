import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';
import {superscriptMarkName, SuperscriptSpecs, superscriptType} from './SuperscriptSpecs';

export {superscriptMarkName, superscriptType} from './SuperscriptSpecs';
/** @deprecated Use `superscriptMarkName` instead */
export const superscript = superscriptMarkName;
const supAction = 'supscript';

export const Superscript: ExtensionAuto = (builder) => {
    builder.use(SuperscriptSpecs);

    builder
        .addAction(supAction, ({schema}) => createToggleMarkAction(superscriptType(schema)))
        .addInputRules(({schema}) => ({
            rules: [
                markInputRule({open: '^', close: '^', ignoreBetween: '^'}, superscriptType(schema)),
            ],
        }));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [supAction]: Action;
        }
    }
}

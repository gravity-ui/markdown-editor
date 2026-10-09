import type {Action, ExtensionAuto} from '../../../core';
import {createMarkdownInlineMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';

import {MarkSpecs, markMarkType} from './MarkSpecs';

export {markMarkName, markMarkType} from './MarkSpecs';
const mAction = 'mark';

export const Mark: ExtensionAuto = (builder) => {
    builder.use(MarkSpecs);

    builder
        .addAction(mAction, ({schema}) => createMarkdownInlineMarkAction(markMarkType(schema)))
        .addInputRules(({schema}) => ({
            rules: [
                markInputRule({open: '==', close: '==', ignoreBetween: '='}, markMarkType(schema)),
            ],
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [mAction]: Action;
        }
    }
}

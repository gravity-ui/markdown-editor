import type {Action, ExtensionAuto} from '../../../core';

import {FoldingHeadingSpecs} from './FoldingHeadingSpec';
import {toggleHeadingFoldingAction} from './actions';
import {
    openHeadingAndCreateParagraphAfterIfCursorAtEndOfHeading,
    removeFoldingIfCursorAtStartOfHeading,
} from './commands';
import {foldingHeadingRule} from './input-rules';
import {foldingPlugin} from './plugins/Folding';
import {headingType} from './utils';

import '@diplodoc/folding-headings-extension/runtime/styles.css';

const action = 'toggleHeadingFolding';

export const FoldingHeading: ExtensionAuto = (builder) => {
    builder.use(FoldingHeadingSpecs);

    builder.addAction(action, () => toggleHeadingFoldingAction);
    builder.addInputRules(({schema}) => ({rules: [foldingHeadingRule(headingType(schema), 6)]}));
    builder.addKeymap(
        () => ({
            Enter: openHeadingAndCreateParagraphAfterIfCursorAtEndOfHeading,
            Backspace: removeFoldingIfCursorAtStartOfHeading,
        }),
        builder.Priority.High,
    );
    builder.addPlugin(foldingPlugin);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [action]: Action;
        }
    }
}

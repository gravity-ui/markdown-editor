import {toggleMark} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {BoldSpecs, boldMarkName, boldType} from './BoldSpecs';

export {boldMarkName, boldType} from './BoldSpecs';
/** @deprecated Use `boldMarkName` instead */
export const bold = boldMarkName;
const bAction = 'bold';

export type BoldOptions = {
    boldKey?: string | null;
};

export const Bold: ExtensionAuto<BoldOptions> = (builder, opts) => {
    builder.use(BoldSpecs);
    builder.addAction(bAction, ({schema}) => createToggleMarkAction(boldType(schema)));

    if (opts?.boldKey) {
        const {boldKey} = opts;
        builder.addKeymap(({schema}) => ({
            [boldKey]: withLogAction('bold', toggleMark(boldType(schema))),
        }));
    }

    builder.addInputRules(({schema}) => ({
        rules: [
            markInputRule({open: '**', close: '**', ignoreBetween: '*'}, boldType(schema)),
            markInputRule({open: '__', close: '__', ignoreBetween: '_'}, boldType(schema)),
        ],
    }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [bAction]: Action;
        }
    }
}

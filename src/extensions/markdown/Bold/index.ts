import {toggleMark} from 'prosemirror-commands';
import {createToggleMarkAction} from '../../../utils/actions';
import type {Action, ExtensionAuto} from '../../../core';
import {markInputRule} from '../../../utils/inputrules';
import {boldMarkName, BoldSpecs, boldType} from './BoldSpecs';

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
        builder.addKeymap(({schema}) => ({[boldKey]: toggleMark(boldType(schema))}));
    }

    builder.addInputRules(({schema}) => ({
        rules: [
            markInputRule({open: '**', close: '**', ignoreBetween: '*'}, boldType(schema)),
            markInputRule({open: '__', close: '__', ignoreBetween: '_'}, boldType(schema)),
        ],
    }));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [bAction]: Action;
        }
    }
}

import {toggleMark} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {ItalicSpecs, italicType} from './ItalicSpecs';

export {italicMarkName, italicType} from './ItalicSpecs';
const iAction = 'italic';

export type ItalicOptions = {
    italicKey?: string | null;
};

export const Italic: ExtensionAuto<ItalicOptions> = (builder, opts) => {
    builder.use(ItalicSpecs);

    builder.addAction(iAction, ({schema}) => createToggleMarkAction(italicType(schema)));

    builder.addInputRules(({schema}) => ({
        rules: [
            markInputRule({open: '*', close: '*', ignoreBetween: '*'}, italicType(schema)),
            markInputRule({open: '_', close: '_', ignoreBetween: '_'}, italicType(schema)),
        ],
    }));

    if (opts?.italicKey) {
        const {italicKey} = opts;
        builder.addKeymap(({schema}) => ({
            [italicKey]: withLogAction('italic', toggleMark(italicType(schema))),
        }));
    }
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [iAction]: Action;
        }
    }
}

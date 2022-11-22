import {toggleMark} from 'prosemirror-commands';
import {createToggleMarkAction} from '../../../utils/actions';
import type {Action, ExtensionAuto} from '../../../core';
import {markTypeFactory} from '../../../utils/schema';
import {markInputRule} from '../../../utils/inputrules';

export const italic = 'em';
const iAction = 'italic';
const iType = markTypeFactory(italic);

export type ItalicOptions = {
    italicKey?: string | null;
};

export const Italic: ExtensionAuto<ItalicOptions> = (builder, opts) => {
    builder
        .addMark(italic, () => ({
            spec: {
                parseDOM: [
                    {tag: 'i'},
                    {tag: 'em'},
                    {style: 'font-style', getAttrs: (value) => value === 'italic' && null},
                ],
                toDOM() {
                    return ['em'];
                },
            },
            toYfm: {open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true},
            fromYfm: {tokenSpec: {name: italic, type: 'mark'}},
        }))
        .addAction(iAction, ({schema}) => createToggleMarkAction(iType(schema)));

    builder.addInputRules(({schema}) => ({
        rules: [
            markInputRule({open: '*', close: '*', ignoreBetween: '*'}, iType(schema)),
            markInputRule({open: '_', close: '_', ignoreBetween: '_'}, iType(schema)),
        ],
    }));

    if (opts?.italicKey) {
        const {italicKey} = opts;
        builder.addKeymap(({schema}) => ({[italicKey]: toggleMark(iType(schema))}));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [iAction]: Action;
        }
    }
}

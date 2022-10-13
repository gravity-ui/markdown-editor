import {toggleMark} from 'prosemirror-commands';
import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markTypeFactory} from '../../../utils/schema';
import {markInputRule} from '../../../utils/inputrules';
const ins = require('markdown-it-ins');

export const underline = 'ins';
const undAction = 'underline';
const undType = markTypeFactory(underline);

export type UnderlineOptions = {
    underlineKey?: string | null;
};

export const Underline: ExtensionAuto<UnderlineOptions> = (builder, opts) => {
    builder
        .configureMd((md) => md.use(ins))
        .addMark(underline, () => ({
            spec: {
                parseDOM: [{tag: 'ins'}],
                toDOM() {
                    return ['ins'];
                },
            },
            toYfm: {open: '++', close: '++', mixable: true, expelEnclosingWhitespace: true},
            fromYfm: {tokenSpec: {name: underline, type: 'mark'}},
        }))
        .addAction(undAction, ({schema}) => createToggleMarkAction(undType(schema)))
        .addInputRules(({schema}) => ({
            rules: [markInputRule({open: '++', close: '++', ignoreBetween: '+'}, undType(schema))],
        }));

    if (opts?.underlineKey) {
        const {underlineKey} = opts;
        builder.addKeymap(({schema}) => ({[underlineKey]: toggleMark(undType(schema))}));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [undAction]: Action;
        }
    }
}

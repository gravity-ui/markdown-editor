import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markTypeFactory} from '../../../utils/schema';
import {markInputRule} from '../../../utils/inputrules';
import log from '@doc-tools/transform/lib/log';
const sup = require('@doc-tools/transform/lib/plugins/sup');

const superscript = 'sup';
const supAction = 'supscript';
const supType = markTypeFactory(superscript);

export const Superscript: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sup, {log}))
        .addMark(superscript, () => ({
            spec: {
                excludes: '_',
                parseDOM: [{tag: 'sup'}],
                toDOM() {
                    return ['sup'];
                },
            },
            toYfm: {open: '^', close: '^', mixable: true, expelEnclosingWhitespace: true},
            fromYfm: {tokenSpec: {name: superscript, type: 'mark'}},
        }))
        .addAction(supAction, ({schema}) => createToggleMarkAction(supType(schema)))
        .addInputRules(({schema}) => ({
            rules: [markInputRule({open: '^', close: '^', ignoreBetween: '^'}, supType(schema))],
        }));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [supAction]: Action;
        }
    }
}

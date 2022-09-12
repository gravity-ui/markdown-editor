import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markTypeFactory} from '../../../utils/schema';
import {markInputRule} from '../../../utils/inputrules';
const sub = require('markdown-it-sub');

const subscript = 'sub';
const subAction = 'subscript';
const subType = markTypeFactory(subscript);

export const Subscript: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sub))
        .addMark(subscript, () => ({
            spec: {
                excludes: '_',
                parseDOM: [{tag: 'sub'}],
                toDOM() {
                    return ['sub'];
                },
            },
            toYfm: {open: '~', close: '~', mixable: false, expelEnclosingWhitespace: true},
            fromYfm: {tokenSpec: {name: subscript, type: 'mark'}},
        }))
        .addAction(subAction, ({schema}) => createToggleMarkAction(subType(schema)))
        .addInputRules(({schema}) => ({
            rules: [markInputRule({open: '~', close: '~', ignoreBetween: '~'}, subType(schema))],
        }));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [subAction]: Action;
        }
    }
}

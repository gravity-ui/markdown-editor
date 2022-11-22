import {toggleMark} from 'prosemirror-commands';
import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';
import {markTypeFactory} from '../../../utils/schema';
import {markInputRule} from '../../../utils/inputrules';

export const strike = 'strike';
const sAction = 'strike';
const sType = markTypeFactory(strike);

export type StrikeOptions = {
    strikeKey?: string | null;
};

export const Strike: ExtensionAuto<StrikeOptions> = (builder, opts) => {
    builder
        .addMark(strike, () => ({
            spec: {
                parseDOM: [{tag: 'strike'}, {tag: 's'}],
                toDOM() {
                    return ['strike'];
                },
            },
            fromYfm: {
                tokenSpec: {
                    name: strike,
                    type: 'mark',
                },
                tokenName: 's',
            },
            toYfm: {open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true},
        }))
        .addAction(sAction, ({schema}) => createToggleMarkAction(sType(schema)))
        .addInputRules(({schema}) => ({
            rules: [markInputRule({open: '~~', close: '~~', ignoreBetween: '~'}, sType(schema))],
        }));

    if (opts?.strikeKey) {
        const {strikeKey} = opts;
        builder.addKeymap(({schema}) => ({[strikeKey]: toggleMark(sType(schema))}));
    }
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [sAction]: Action;
        }
    }
}

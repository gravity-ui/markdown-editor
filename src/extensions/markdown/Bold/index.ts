import {toggleMark} from 'prosemirror-commands';
import {createToggleMarkAction} from '../../../utils/actions';
import {Action, createExtension, ExtensionAuto} from '../../../core';
import {markTypeFactory} from '../../../utils/schema';
import {markInputRule} from '../../../utils/inputrules';

export const bold = 'strong';
const bAction = 'bold';
const bType = markTypeFactory(bold);

export type BoldOptions = {
    boldKey?: string | null;
};

export const Bold: ExtensionAuto<BoldOptions> = (builder, opts) => {
    builder
        .addMark(bold, () => ({
            spec: {
                parseDOM: [{tag: 'strong'}],
                toDOM() {
                    return ['strong'];
                },
            },
            fromYfm: {
                tokenSpec: {
                    name: bold,
                    type: 'mark',
                },
            },
            toYfm: {open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true},
        }))
        .addAction(bAction, ({schema}) => createToggleMarkAction(bType(schema)));

    if (opts?.boldKey) {
        const {boldKey} = opts;
        builder.addKeymap(({schema}) => ({[boldKey]: toggleMark(bType(schema))}));
    }

    builder.addInputRules(({schema}) => ({
        rules: [
            markInputRule({open: '**', close: '**', ignoreBetween: '*'}, bType(schema)),
            markInputRule({open: '__', close: '__', ignoreBetween: '_'}, bType(schema)),
        ],
    }));
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const BoldE = createExtension<BoldOptions>((b, o = {}) => b.use(Bold, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [bAction]: Action;
        }
    }
}

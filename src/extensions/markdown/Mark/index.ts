import type {PluginSimple} from 'markdown-it';
import {Action, createExtension, ExtensionAuto} from '../../../core';
import {markTypeFactory} from '../../../utils/schema';
import {createToggleMarkAction} from '../../../utils/actions';
import {markInputRule} from '../../../utils/inputrules';
const mdPlugin: PluginSimple = require('markdown-it-mark');

export const mark = 'mark';
const mAction = 'mark';
const mType = markTypeFactory(mark);

export const Mark: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(mdPlugin))
        .addMark(mark, () => ({
            spec: {
                parseDOM: [{tag: 'mark'}],
                toDOM() {
                    return ['mark'];
                },
            },
            fromYfm: {
                tokenSpec: {
                    name: mark,
                    type: 'mark',
                },
            },
            toYfm: {
                open: '==',
                close: '==',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }))
        .addAction(mAction, ({schema}) => createToggleMarkAction(mType(schema)))
        .addInputRules(({schema}) => ({
            rules: [markInputRule({open: '==', close: '==', ignoreBetween: '='}, mType(schema))],
        }));
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const MarkE = createExtension((b) => b.use(Mark));

declare global {
    namespace YfmEditor {
        interface Actions {
            [mAction]: Action;
        }
    }
}

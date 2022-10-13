import {chainCommands, wrapIn} from 'prosemirror-commands';
import type {NodeType} from 'prosemirror-model';
import {wrappingInputRule} from 'prosemirror-inputrules';
import {hasParentNodeOfType} from 'prosemirror-utils';
import type {Action, ExtensionAuto} from '../../../core';
import {selectQuoteBeforeCursor, liftFromQuote, toggleQuote} from './commands';
import {blockquote, bqType} from './const';

export {blockquote};
const bqAction = 'quote';

export type BlockquoteOptions = {
    qouteKey?: string | null;
};

export const Blockquote: ExtensionAuto<BlockquoteOptions> = (builder, opts) => {
    builder.addNode(blockquote, () => ({
        spec: {
            content: 'block+',
            group: 'block',
            defining: true,
            parseDOM: [{tag: 'blockquote'}],
            toDOM() {
                return ['blockquote', 0];
            },
        },
        fromYfm: {tokenSpec: {name: blockquote, type: 'block'}},
        toYfm: (state, node) => {
            state.wrapBlock('> ', null, node, () => state.renderContent(node));
        },
    }));

    if (opts?.qouteKey) {
        const {qouteKey} = opts;
        builder.addKeymap(({schema}) => ({[qouteKey]: wrapIn(bqType(schema))}));
    }

    builder.addKeymap(() => ({
        Backspace: chainCommands(liftFromQuote, selectQuoteBeforeCursor),
    }));

    builder.addInputRules(({schema}) => ({rules: [blockQuoteRule(bqType(schema))]}));

    builder.addAction(bqAction, ({schema}) => {
        const bq = bqType(schema);
        return {
            isActive: (state) => hasParentNodeOfType(bq)(state.selection),
            isEnable: toggleQuote,
            run: toggleQuote,
        };
    });
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [bqAction]: Action;
        }
    }
}

/**
 * Given a blockquote node type, returns an input rule that turns `"> "`
 * at the start of a textblock into a blockquote.
 */
function blockQuoteRule(nodeType: NodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType);
}

import {chainCommands, wrapIn} from 'prosemirror-commands';
import type {NodeType} from 'prosemirror-model';
import {wrappingInputRule} from 'prosemirror-inputrules';
import {hasParentNodeOfType} from 'prosemirror-utils';
import type {Action, ExtensionAuto} from '../../../core';
import {selectQuoteBeforeCursor, liftFromQuote, toggleQuote} from './commands';
import {BlockquoteSpecs, blockquoteType} from './BlockquoteSpecs';

export {blockquote, blockquoteNodeName, blockquoteType} from './const';
const bqAction = 'quote';

export type BlockquoteOptions = {
    qouteKey?: string | null;
};

export const Blockquote: ExtensionAuto<BlockquoteOptions> = (builder, opts) => {
    builder.use(BlockquoteSpecs);

    if (opts?.qouteKey) {
        const {qouteKey} = opts;
        builder.addKeymap(({schema}) => ({[qouteKey]: wrapIn(blockquoteType(schema))}));
    }

    builder.addKeymap(() => ({
        Backspace: chainCommands(liftFromQuote, selectQuoteBeforeCursor),
    }));

    builder.addInputRules(({schema}) => ({rules: [blockQuoteRule(blockquoteType(schema))]}));

    builder.addAction(bqAction, ({schema}) => {
        const bq = blockquoteType(schema);
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

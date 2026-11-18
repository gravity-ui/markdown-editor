import '@diplodoc/quote-link-extension/runtime';
import {isMarkActive, linkType} from '@gravity-ui/markdown-editor';
import {wrappingInputRule} from '@gravity-ui/markdown-editor/_/utils/rulebuilders.js';
import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {NodeType} from '@gravity-ui/markdown-editor/pm/model';
import {hasParentNodeOfType} from '@gravity-ui/markdown-editor/pm/utils';

import {QuoteLinkSpecs, quoteLinkType} from './QuoteLinkSpecs';
import {addQuoteLink, toggleQuote} from './commands';
import {addLinkToQuoteLinkAction, quoteLinkAction} from './const';

import './QuoteLink.scss';
import '@diplodoc/quote-link-extension/runtime/styles.css';

export const QuoteLink: ExtensionAuto = (builder) => {
    builder.use(QuoteLinkSpecs);

    builder.addInputRules(({schema}) => ({
        rules: [quoteLinkInputRule(quoteLinkType(schema))],
    }));

    builder.addAction(quoteLinkAction, ({schema}) => {
        const quoteLink = quoteLinkType(schema);

        return {
            isActive: (state) => hasParentNodeOfType(quoteLink)(state.selection),
            isEnable: toggleQuote,
            run: toggleQuote,
        };
    });

    builder.addAction(addLinkToQuoteLinkAction, (deps) => ({
        isActive: (state) => Boolean(isMarkActive(state, linkType(state.schema))),
        isEnable: addQuoteLink(deps),
        run: addQuoteLink(deps),
    }));
};

/**
 * Given a quoteLink node type, returns an input rule that turns `"> "`
 * at the start of a textblock into a quoteLink.
 */
function quoteLinkInputRule(nodeType: NodeType) {
    return wrappingInputRule(/^\s*>\s$/, nodeType);
}

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [quoteLinkAction]: Action;
            [addLinkToQuoteLinkAction]: Action;
        }
    }
}

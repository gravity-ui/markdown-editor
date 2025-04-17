import '@diplodoc/quote-link-extension/runtime';
import type {NodeType} from 'prosemirror-model';
// @ts-ignore // TODO: fix cjs build
import {hasParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto} from '#core';
import {linkType} from 'src/extensions';
import {isMarkActive, wrappingInputRule} from 'src/utils';

import {QuoteLinkSpecs, quoteLinkType} from './QuoteLinkSpecs';
import {addQuoteLink, toggleQuote} from './commands';

import './index.scss';
import '@diplodoc/quote-link-extension/runtime/styles.css';

const quoteLinkAction = 'quoteLink';

const addLinkToQuoteLinkAction = 'addLinkToQuoteLink';

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

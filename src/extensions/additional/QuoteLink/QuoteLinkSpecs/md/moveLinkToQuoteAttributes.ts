import type {PluginSimple} from 'markdown-it';

import {matchLinkAtInlineStart} from 'src/extensions/additional/QuoteLink/QuoteLinkSpecs/md/utils';

import {QuoteLinkAttr} from '..';

export const moveLinkToQuoteAttributes: PluginSimple = (md) => {
    md.core.ruler.push('move-link-to-quote-attributes', (state) => {
        const {tokens} = state;

        let i = 0;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type === 'yfm_quote-link_open') {
                const inlineToken = tokens[i + 2];
                const linkMatch = matchLinkAtInlineStart(inlineToken);

                if (
                    linkMatch?.openToken.attrIndex('data-quotelink') !== -1 &&
                    linkMatch?.closeTokenIndex
                ) {
                    token.attrSet(QuoteLinkAttr.Cite, linkMatch?.openToken.attrGet('href') ?? '');
                    const content = inlineToken.children
                        ?.slice(1, linkMatch.closeTokenIndex)
                        .reduce((result, item) => result + item.content, '')
                        .trim();
                    if (content) {
                        token.attrSet(QuoteLinkAttr.DataContent, content);
                    }

                    if (linkMatch.closeTokenIndex === (inlineToken.children?.length ?? 0) - 1) {
                        tokens.splice(i + 1, 3);
                    } else {
                        inlineToken.children?.splice(0, linkMatch.closeTokenIndex + 1);
                        if (inlineToken.children?.every((childToken) => !childToken.content)) {
                            tokens.splice(i + 1, 3);
                        }
                    }
                }
            }

            i++;
        }
    });
};

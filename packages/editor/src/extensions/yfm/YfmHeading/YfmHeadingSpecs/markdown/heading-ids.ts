import type MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

import {getCustomIds, getHeadingAttributeSuffix, removeCustomIds} from './utils/custom-id';

/**
 * MarkdownIt plugin for parsing custom IDs in headings.
 * It replicates the logic of '@diplodoc/transform'.
 * @see https://github.com/diplodoc-platform/transform/blob/master/src/transform/plugins/anchors/index.ts
 */
export const headingIdsPlugin: MarkdownIt.PluginSimple = (md) => {
    const parseHeadingIds = (state: StateCore) => {
        const {tokens} = state;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type !== 'heading_open') continue;

            const inlineToken = tokens[i + 1];
            if (inlineToken?.type !== 'inline') continue;

            const customIds = getCustomIds(inlineToken);
            if (customIds) {
                token.attrSet('id', customIds[0]);
                removeCustomIds(inlineToken);
            }

            protectLiteralHeadingAttributes(state, inlineToken, !customIds);
        }
    };

    try {
        md.core.ruler.before('curly_attributes', 'heading-attrs', parseHeadingIds);
    } catch {
        md.core.ruler.before('linkify', 'heading-attrs', parseHeadingIds);
    }
};

function protectLiteralHeadingAttributes(
    state: StateCore,
    token: Token,
    allowAttributes: boolean,
    left = '{',
    right = '}',
) {
    const suffix = allowAttributes ? getHeadingAttributeSuffix(token, left, right) : undefined;
    token.children =
        token.children?.flatMap((child, index) => {
            if (child.type !== 'text') {
                return [child];
            }

            const tokens: Token[] = [];
            const end = suffix?.index === index ? suffix.match.index : child.content.length;
            let start = 0;
            for (
                let delimiter = child.content.indexOf(left);
                delimiter >= 0 && delimiter < end;
                delimiter = child.content.indexOf(left, start)
            ) {
                if (delimiter > start) {
                    const text = new state.Token('text', '', 0);
                    text.content = child.content.slice(start, delimiter);
                    text.level = child.level;
                    tokens.push(text);
                }

                // text_join restores this delimiter after markdown-it-attrs runs.
                const literal = new state.Token('text_special', '', 0);
                literal.content = left;
                literal.level = child.level;
                tokens.push(literal);
                start = delimiter + left.length;
            }

            child.content = child.content.slice(start);
            tokens.push(child);
            return tokens;
        }) || null;
}

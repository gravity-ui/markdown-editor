import type MarkdownIt from 'markdown-it';

import {getCustomIds, removeCustomIds} from './utils/custom-id';

/**
 * MarkdownIt plugin for parsing custom IDs in headings.
 * It replicates the logic of '@diplodoc/transform'.
 * @see https://github.com/diplodoc-platform/transform/blob/master/src/transform/plugins/anchors/index.ts
 */
export const headingIdsPlugin: MarkdownIt.PluginSimple = (md) => {
    md.core.ruler.push('heading-attrs', (state) => {
        const {tokens} = state;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type !== 'heading_open') continue;

            const inlineToken = tokens[i + 1];
            if (inlineToken?.type !== 'inline') continue;

            const customIds = getCustomIds(inlineToken.content);
            if (customIds) {
                const id = customIds[0];
                token.attrSet('id', id);
                removeCustomIds(inlineToken);
            }
        }
    });
};

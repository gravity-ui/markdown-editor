import dedent from 'ts-dedent';
import {v5} from 'uuid';

import {DynamicModifiers} from '../../core/types/dynamicModifiers';
import {MarkupManager} from '../MarkupManager';

const YFM_TABLE_TOKEN_ATTR = 'data-token-id';
const YFM_TABLE_NODE_ATTR = 'data-node-id';

export function createDynamicModifiers(markupManager: MarkupManager): DynamicModifiers[] {
    return [
        {
            type: 'parserToken',
            tokenName: 'yfm_table',
            /**
             * - Assigns a unique `data-token-id` to each token.
             * - Captures and stores the raw Markdown using `MarkupManager`.
             */
            process: (token, _, rawMarkup) => {
                const {map} = token;

                if (map) {
                    const content = rawMarkup.split('\n').slice(map[0], map[1]).join('\n').trim();
                    const tokenId = v5(content, markupManager.getNamespace());

                    if (/^\s*#\|/.test(content)) {
                        token.attrSet(YFM_TABLE_TOKEN_ATTR, tokenId);
                        markupManager.setMarkup(tokenId, dedent(content));
                    }
                }
                return token;
            },
        },
        {
            type: 'parserNodeAttrs',
            tokenName: 'yfm_table',
            /**
             * - Links the token to its corresponding node via `data-node-id`.
             */
            process: (token, attrs) => ({
                ...attrs,
                [YFM_TABLE_NODE_ATTR]: token.attrGet(YFM_TABLE_TOKEN_ATTR),
            }),
        },
        {
            type: 'parserNode',
            nodeName: 'yfm_table',
            process: (node) => {
                const nodeId = node.attrs[YFM_TABLE_NODE_ATTR];
                if (nodeId) {
                    markupManager.setNode(nodeId, node);
                }
                return node;
            },
        },
        {
            type: 'serializerNode',
            nodeName: 'yfm_table',
            /**
             * - Retrieves the original Markdown using the `data-node-id` attribute.
             * - Uses the original Markdown if the node matches the saved version.
             * - Falls back to schema-based rendering if the node structure, attributes, or parent elements affect it.
             */
            process: (state, node, parent, index, callback) => {
                const nodeId = node.attrs[YFM_TABLE_NODE_ATTR];
                const savedNode = markupManager.getNode(nodeId);

                if (savedNode?.eq(node)) {
                    const content: string = markupManager.getMarkup(nodeId) || '';
                    state.ensureNewLine();
                    state.text(content, false);
                    state.ensureNewLine();
                    state.closeBlock();
                    state.write('\n');
                    return;
                }

                callback?.(state, node, parent, index);
            },
        },
        {
            type: 'schemaNodeSpec',
            nodeName: 'yfm_table',
            /**
             * - Adds the `data-node-id` attribute to the list of allowed attributes.
             */
            allowedAttrs: [YFM_TABLE_NODE_ATTR],
        },
    ];
}

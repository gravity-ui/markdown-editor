import {v5} from 'uuid';

import {
    MarkdownParserDynamicModifierConfig,
    MarkdownSerializerDynamicModifierConfig,
} from '../../core/';
import {MarkupManager} from '../../core/markdown/MarkupManager';

const YFM_TABLE_TOKEN_ATTR = 'data-token-id';
const YFM_TABLE_NODE_ATTR = 'data-node-id';
const PARENTS_WITH_AFFECT = ['blockquote', 'yfm_tabs'];

/**
 * Creates a hook for injecting custom logic into the parsing process via `MarkdownParserDynamicModifier`,
 * allowing extensions beyond the fixed parsing rules defined by the schema.
 *
 * Dynamically configures parsing for `yfm_table` elements:
 * - Assigns a unique `data-token-id` to each token.
 * - Captures and stores the raw Markdown using `MarkupManager`.
 * - Links the token to its corresponding node via `data-node-id`.
 * - Adds the `data-node-id` attribute to the list of allowed attributes.
 */
export function createParserDynamicModifierConfig(
    markupManager: MarkupManager,
): MarkdownParserDynamicModifierConfig {
    return {
        ['yfm_table']: {
            processToken: [
                (token, _, rawMarkup) => {
                    const {map} = token;

                    if (map) {
                        const content = rawMarkup.split('\n').slice(map[0], map[1]).join('\n');
                        const tokenId = v5(content, markupManager.getNamespace());

                        token.attrSet(YFM_TABLE_TOKEN_ATTR, tokenId);
                        markupManager.setMarkup(tokenId, content);
                    }
                    return token;
                },
            ],
            processNodeAttrs: [
                (token, attrs) => ({
                    ...attrs,
                    [YFM_TABLE_NODE_ATTR]: token.attrGet(YFM_TABLE_TOKEN_ATTR),
                }),
            ],
            processNode: [
                (node) => {
                    const nodeId = node.attrs[YFM_TABLE_NODE_ATTR];
                    if (nodeId) {
                        markupManager.setNode(nodeId, node);
                    }
                    return node;
                },
            ],
            allowedAttrs: [YFM_TABLE_NODE_ATTR],
        },
    };
}

/**
 * Creates a hook for injecting custom logic into the serialization process via `MarkdownSerializerDynamicModifier`,
 * allowing extensions beyond the standard serialization rules defined by the schema.
 *
 * Dynamically configures serialization for `yfm_table` elements:
 * - Retrieves the original Markdown using the `data-node-id` attribute.
 * - Uses the original Markdown if the node matches the saved version.
 * - Falls back to schema-based rendering if the node structure, attributes, or parent elements affect it.
 */
export function createSerializerDynamicModifierConfig(
    markupManager: MarkupManager,
): MarkdownSerializerDynamicModifierConfig {
    return {
        ['yfm_table']: {
            processNode: [
                (state, node, parent, index, callback) => {
                    const nodeId = node.attrs[YFM_TABLE_NODE_ATTR];
                    const savedNode = markupManager.getNode(nodeId);

                    if (!PARENTS_WITH_AFFECT.includes(parent?.type?.name) && savedNode?.eq(node)) {
                        state.write(markupManager.getMarkup(nodeId) + '\n');
                        return;
                    }

                    callback?.(state, node, parent, index);
                },
            ],
        },
    };
}

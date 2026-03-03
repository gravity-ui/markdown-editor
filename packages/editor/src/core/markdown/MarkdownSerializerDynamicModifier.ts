import type {Node} from 'prosemirror-model';

import type {SerializerNodeToken, SerializerState} from '../types/serializer';

export type SerializerProcessNode = (
    state: SerializerState,
    node: Node,
    parent: Node,
    index: number,
    callback?: SerializerNodeToken,
) => void;

export interface SerializerNodeProcessor {
    processNode?: SerializerProcessNode[];
}

export interface MarkdownSerializerDynamicModifierConfig {
    [nodeType: string]: SerializerNodeProcessor;
}

/**
 * Class MarkdownSerializerDynamicModifier
 *
 * Provides a mechanism for dynamic modification of node serialization during conversion of ProseMirror nodes
 * to a markdown-like format. It allows sequential processing of nodes by applying a series of custom handlers:
 *
 *    - `processNode`: An array of handlers that process nodes sequentially, each modifying the output.
 *
 * Example:
 * ```ts
 * const serializerModifier = new MarkdownSerializerDynamicModifier({
 *     paragraph: {
 *         processNode: [
 *             (state, node, parent, index, callback) => {
 *                 // Custom modifications can be performed here.
 *                 callback(state, node, parent, index);
 *             },
 *         ],
 *     },
 * });
 * ```
 *
 * This class extends the functionality of a MarkdownSerializer for scenarios such as:
 * - Customizing the serialization output.
 * - Logging or modifying node content during serialization.
 */
export class MarkdownSerializerDynamicModifier {
    private nodeProcessors: Map<string, SerializerNodeProcessor>;

    constructor(config: MarkdownSerializerDynamicModifierConfig) {
        this.nodeProcessors = new Map(Object.entries(config));
    }

    processNode(
        state: SerializerState,
        node: Node,
        parent: Node,
        index: number,
        callback: SerializerNodeToken,
    ): void {
        const nodeType = this.nodeProcessors.get(node.type.name);

        if (!nodeType || !nodeType.processNode || nodeType.processNode.length === 0) {
            callback(state, node, parent, index);
        } else {
            nodeType.processNode.forEach((process) => {
                process(state, node, parent, index, callback);
            });
        }
    }
}

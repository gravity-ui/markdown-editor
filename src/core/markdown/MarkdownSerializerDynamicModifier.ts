import {Node} from 'prosemirror-model';

import {SerializerNodeToken, SerializerState} from '../types/serializer';
import {buildKeyMapping} from '../utils/buildKeyMapping';

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
 * to a markdown-like format. It allows sequential processing of nodes by applying a series of custom handlers,
 * making it possible to:
 *
 * 1. Node Processing:
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
    private keyMapping: Map<string, string[]>;

    constructor(config: MarkdownSerializerDynamicModifierConfig) {
        const {processorsMap, keyMapping} = buildKeyMapping<SerializerNodeProcessor>(config);
        this.nodeProcessors = processorsMap;
        this.keyMapping = keyMapping;
    }

    processNode(
        state: SerializerState,
        node: Node,
        parent: Node,
        index: number,
        callback: SerializerNodeToken,
    ): void {
        const complexKeys = this.keyMapping.get(node.type.name) || [];
        let foundAnyProcessor = false;

        for (const complexKey of complexKeys) {
            const processor = this.nodeProcessors.get(complexKey);
            if (processor?.processNode?.length) {
                foundAnyProcessor = true;
                for (const fn of processor.processNode) {
                    fn(state, node, parent, index, callback);
                }
            }
        }

        if (!foundAnyProcessor) {
            callback(state, node, parent, index);
        }
    }
}

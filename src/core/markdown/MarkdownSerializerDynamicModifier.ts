import {Node} from 'prosemirror-model';

import {SerializerNodeToken, SerializerState} from '../types/serializer';

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
        const processor = this.nodeProcessors.get(node.type.name);
        if (!processor || !processor.processNode || processor.processNode.length === 0) {
            callback(state, node, parent, index);
        } else {
            processor.processNode.forEach((process) => {
                process(state, node, parent, index, callback);
            });
        }
    }
}

import {MarkdownSerializer} from './markdown/MarkdownSerializer';
import {MarkupManager} from './markdown/MarkupManager';
import type {Serializer, SerializerMarkToken, SerializerNodeToken} from './types/serializer';

export class SerializerTokensRegistry {
    #nodes: Record<string, SerializerNodeToken> = {};
    #marks: Record<string, SerializerMarkToken> = {};

    addNode(name: string, node: SerializerNodeToken) {
        this.#nodes[name] = node;
        return this;
    }

    addMark(name: string, mark: SerializerMarkToken) {
        this.#marks[name] = mark;
        return this;
    }

    createSerializer(markupManager: MarkupManager): Serializer {
        return new MarkdownSerializer(this.#nodes, this.#marks, markupManager);
    }
}

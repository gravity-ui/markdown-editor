import type {Fragment, Mark, Node} from 'prosemirror-model';
import type {MarkdownSerializerState as SerializerState} from '../markdown/MarkdownSerializer';

export type {MarkdownSerializerState as SerializerState} from '../markdown/MarkdownSerializer';

export interface Serializer {
    /** Serialize the content of the given node to markup */
    serialize(content: Node | Fragment, options?: object): string;
}

export interface SerializerTests extends Serializer {
    containsNode(nodeName: string): boolean;
    containsMark(markName: string): boolean;
}

/** see MarkdownSerializer */
export interface SerializerNodeToken {
    (state: SerializerState, node: Node, parent: Node, index: number): void;
}

/** see MarkdownSerializer */
export interface SerializerMarkToken {
    open:
        | string
        | ((state: SerializerState, node: Mark, parent: Fragment, index: number) => string);
    close:
        | string
        | ((state: SerializerState, node: Mark, parent: Fragment, index: number) => string);
    mixable?: boolean;
    escape?: boolean;
    expelEnclosingWhitespace?: boolean;
}

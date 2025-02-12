export type {
    MarkdownSerializerState as SerializerState,
    SerializerNodeToken,
    SerializerMarkToken,
    MarkdownSerializer as Serializer,
} from '../markdown/MarkdownSerializer';

declare module 'prosemirror-model' {
    interface NodeSpec {
        /** Default false */
        isBreak?: boolean;
    }
}

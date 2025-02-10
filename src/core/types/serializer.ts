export type {
    MarkdownSerializerState as SerializerState,
    SerializerNodeToken,
    SerializerMarkToken,
    MarkdownSerializer as SerializerTests,
} from '../markdown/MarkdownSerializer';

declare module 'prosemirror-model' {
    interface NodeSpec {
        /** Default false */
        isBreak?: boolean;
    }
}

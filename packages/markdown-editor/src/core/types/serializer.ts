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
        /**
         * For non default textblocks.
         * Set true if textblock can contain line breaks (soft-break or/and hard-break).
         */
        canContainBreaks?: boolean;
    }
}

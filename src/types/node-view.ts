import type {Node} from '#pm/model';
import type {Decoration, DecorationSource, EditorView, NodeView} from '#pm/view';

export type {NodeView, NodeViewConstructor} from '#pm/view';

export type NodeViewProps = {
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    decorations: readonly Decoration[];
    innerDecorations: DecorationSource;
};

export type NodeViewUpdateFn = NonNullable<NodeView['update']>;

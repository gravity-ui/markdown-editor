import type {Mark, Node} from 'prosemirror-model';
import type {Decoration, DecorationSource, EditorView, NodeView} from 'prosemirror-view';

// inner type of prosemirror-view
export type NodeViewConstructor = (
    node: Node,
    view: EditorView,
    getPos: () => number,
    decorations: readonly Decoration[],
    innerDecorations: DecorationSource,
) => NodeView;

// inner type of prosemirror-view
export type MarkViewConstructor = (
    mark: Mark,
    view: EditorView,
    inline: boolean,
) => {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
};

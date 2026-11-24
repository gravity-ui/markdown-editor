import type {Node, NodeType, ResolvedPos, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, Selection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

export const findDepth = ($pos: ResolvedPos, type: NodeType, from = $pos.depth) => {
    let depth = from;
    while (depth > 0 && $pos.node(depth).type !== type) depth--;
    return depth;
};

export const textRange = (doc: Node, $pos: ResolvedPos, depth: number) => ({
    first: Selection.findFrom(doc.resolve($pos.start(depth)), 1, true),
    last: Selection.findFrom(doc.resolve($pos.end(depth)), -1, true),
});

export const selectionInside =
    (nodeType: (schema: Schema) => NodeType) =>
    (_view: EditorView, $anchor: ResolvedPos, $head: ResolvedPos): TextSelection | null => {
        const doc = $anchor.doc;
        const schema = doc.type.schema;
        const forward = $anchor.pos <= $head.pos;
        const depth = findDepth($anchor, nodeType(schema));
        if (!depth) return null;
        const boundary = forward ? $anchor.end(depth) : $anchor.start(depth);
        if (forward ? $head.pos <= boundary : $head.pos >= boundary) return null;
        const outside = forward ? $anchor.after(depth) : $anchor.before(depth);
        const adjacent = Selection.findFrom(doc.resolve(outside), forward ? 1 : -1, true);
        if (adjacent && (forward ? $head.pos > adjacent.from : $head.pos < adjacent.to))
            return null;
        const edge = Selection.findFrom(doc.resolve(boundary), forward ? -1 : 1, true);
        return edge && TextSelection.create(doc, $anchor.pos, edge.head);
    };

export const selectionInsidePlugin = (nodeType: (schema: Schema) => NodeType) =>
    new Plugin({props: {createSelectionBetween: selectionInside(nodeType)}});

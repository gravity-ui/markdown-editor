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
        const [$start, $end] = forward ? [$anchor, $head] : [$head, $anchor];
        const depth = findDepth($start, nodeType(schema));
        if (!depth || $end.pos <= $start.end(depth)) return null;
        const next = Selection.findFrom(doc.resolve($start.after(depth)), 1, true);
        if (next && $end.pos > next.from) return null;
        const {last} = textRange(doc, $start, depth);
        if (!last || last.to < $start.pos) return null;
        return forward
            ? TextSelection.create(doc, $start.pos, last.to)
            : TextSelection.create(doc, last.to, $start.pos);
    };

export const selectionInsidePlugin = (nodeType: (schema: Schema) => NodeType) =>
    new Plugin({props: {createSelectionBetween: selectionInside(nodeType)}});

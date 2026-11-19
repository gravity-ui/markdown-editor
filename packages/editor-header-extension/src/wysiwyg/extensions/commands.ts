import {pType} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {Command, Transaction} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

export const runCommand = (view: EditorView, command: Command) =>
    command(view.state, view.dispatch, view);

/** Removes a child block; the last one is replaced with an empty paragraph to keep the parent valid. */
export function removeChild(tr: Transaction, parent: Node, {node, pos}: {node: Node; pos: number}) {
    if (parent.childCount === 1) {
        tr.replaceWith(pos, pos + node.nodeSize, pType(tr.doc.type.schema).create());
    } else {
        tr.delete(pos, pos + node.nodeSize);
    }
}

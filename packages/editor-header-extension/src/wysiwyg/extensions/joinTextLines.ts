import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorState, Transaction} from '@gravity-ui/markdown-editor/pm/state';

import {coveringRanges} from './changedRange';
import {LINE_BREAK} from './directive';

export function joinTextLines(
    trs: readonly Transaction[],
    state: EditorState,
    isSingleLine: (text: Node, parent: Node) => boolean,
) {
    const ranges = coveringRanges(trs, (tr) => tr.docChanged);
    if (!ranges.length) return null;
    const from = Math.min(...ranges.map((range) => range.from));
    const to = Math.max(...ranges.map((range) => range.to));
    const tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos, parent) => {
        if (!node.isText || !parent || !isSingleLine(node, parent)) return true;
        for (const {0: lineBreak, index} of (node.text ?? '').matchAll(LINE_BREAK)) {
            tr.replaceWith(
                tr.mapping.map(pos + index),
                tr.mapping.map(pos + index + lineBreak.length),
                state.schema.text(' ', node.marks),
            );
        }
        return false;
    });
    return tr.docChanged ? tr : null;
}

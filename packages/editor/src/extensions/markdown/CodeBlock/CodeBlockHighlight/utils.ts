import type {Node} from '#pm/model';
import type {Transaction} from '#pm/state';
import type {DecorationSet} from '#pm/view';
import {forEachChangedNode} from 'src/utils/transaction';

import {CodeBlockNodeAttr, codeBlockNodeName} from '../CodeBlockSpecs';

/** @internal */
export function isLineNumbersVisible(node: Node): boolean {
    return node.attrs[CodeBlockNodeAttr.ShowLineNumbers] === 'true';
}

/** @internal */
export function processChangedCodeBlocks(
    tr: Transaction,
    decoSet: DecorationSet,
    onCodeBlock: (node: Node, pos: number, decoSet: DecorationSet) => DecorationSet,
): DecorationSet {
    decoSet = decoSet.map(tr.mapping, tr.doc);

    forEachChangedNode(tr, (node, pos) => {
        if (node.type.name !== codeBlockNodeName) {
            if (node.isTextblock) {
                // Remove stale decorations from non-code_block textblocks
                // (e.g. when a code_block is converted to a paragraph)
                decoSet = decoSet.remove(decoSet.find(pos, pos + node.nodeSize));
                return false;
            }
            return true;
        }
        decoSet = onCodeBlock(node, pos, decoSet);
        return false;
    });

    return decoSet;
}

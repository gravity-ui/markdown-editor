import {Node} from 'prosemirror-model';
import {Transaction} from 'prosemirror-state';

export const removeNode: (params: {
    node: Node;
    pos: number;
    tr: Transaction;
    dispatch: (tr: Transaction) => void;
}) => void = ({node, pos, tr, dispatch}) => {
    dispatch(tr.delete(pos, pos + node.nodeSize));
};

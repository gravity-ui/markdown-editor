import type {Node} from '#pm/model';
import type {Transaction} from '#pm/state';

import {CodeBlockNodeAttr} from '../../CodeBlockSpecs';
import {isLineNumbersVisible} from '../utils';

export {isLineNumbersVisible} from '../utils';

export const toggleLineNumbers: (params: {
    node: Node;
    pos: number;
    tr: Transaction;
    dispatch: (tr: Transaction) => void;
}) => void = ({node, pos, tr, dispatch}) => {
    const showLineNumbers = isLineNumbersVisible(node);
    dispatch(
        tr.setNodeAttribute(pos, CodeBlockNodeAttr.ShowLineNumbers, showLineNumbers ? '' : 'true'),
    );
};

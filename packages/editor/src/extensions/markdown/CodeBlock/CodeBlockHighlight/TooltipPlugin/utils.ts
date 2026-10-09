import type {Node} from '#pm/model';
import type {EditorState, Transaction} from '#pm/state';

import {CodeBlockNodeAttr} from '../../CodeBlockSpecs';
import {
    disableLineWrapping,
    enableLineWrapping,
    isNodeHasLineWrapping,
} from '../plugins/codeBlockLineWrappingPlugin';
import {isLineNumbersVisible} from '../utils';

/** @internal */
export {isLineNumbersVisible} from '../utils';

/** @internal */
export const toggleLineNumbers: (params: {
    node: Node;
    pos: number;
    state: EditorState;
    dispatch: (tr: Transaction) => void;
}) => void = ({node, pos, state, dispatch}) => {
    const showLineNumbers = isLineNumbersVisible(node);
    dispatch(
        state.tr.setNodeAttribute(
            pos,
            CodeBlockNodeAttr.ShowLineNumbers,
            showLineNumbers ? '' : 'true',
        ),
    );
};

/** @internal */
export const toggleLineWrapping: (params: {
    node: Node;
    pos: number;
    state: EditorState;
    dispatch: (tr: Transaction) => void;
}) => void = ({pos, state, dispatch}) => {
    const {tr} = state;
    const hasLineWrapping = isNodeHasLineWrapping(state, pos);
    if (hasLineWrapping) disableLineWrapping(tr, pos);
    else enableLineWrapping(tr, pos);
    dispatch(tr);
};

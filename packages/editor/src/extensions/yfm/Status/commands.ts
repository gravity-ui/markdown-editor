import type {NodeType} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection} from 'prosemirror-state';

import type {Colors} from '../Color/const';

import {StatusAttr, defaultStatusColor, statusType} from './StatusSpecs';

export type StatusAttrs = {
    [StatusAttr.Text]?: string;
    [StatusAttr.Color]?: Colors;
};

const canInsertStatus = (state: EditorState, type: NodeType): boolean => {
    const {$from, $to} = state.selection;
    const index = $from.index();

    return $from.sameParent($to) && $from.parent.canReplaceWith(index, index, type);
};

const findStatus = (state: EditorState, pos: number) => {
    const node = state.doc.nodeAt(pos);
    return node?.type === statusType(state.schema) ? node : null;
};

export const insertStatus =
    (text: string): Command =>
    (state, dispatch) => {
        const type = statusType(state.schema);
        if (!canInsertStatus(state, type)) return false;

        if (dispatch) {
            const {from, to} = state.selection;
            const tr = state.tr.replaceWith(
                from,
                to,
                type.create({[StatusAttr.Text]: text, [StatusAttr.Color]: defaultStatusColor}),
            );

            dispatch(tr.setSelection(NodeSelection.create(tr.doc, from)).scrollIntoView());
        }

        return true;
    };

export const updateStatus =
    (pos: number, attrs: StatusAttrs): Command =>
    (state, dispatch) => {
        const node = findStatus(state, pos);
        if (!node) return false;

        if (dispatch) {
            const tr = state.tr.setNodeMarkup(pos, null, {...node.attrs, ...attrs});
            dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
        }

        return true;
    };

import type {NodeType} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection, TextSelection} from 'prosemirror-state';

import type {Keymap} from '../../../core';
import {get$Cursor} from '../../../utils/selection';

import {StatusAttr, type StatusColor, defaultStatusColor, statusType} from './StatusSpecs';

export type StatusAttrs = {
    [StatusAttr.Text]?: string;
    [StatusAttr.Color]?: StatusColor;
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

type Direction = 'left' | 'right';

const findAdjacentStatus = (state: EditorState, dir: Direction) => {
    const $cursor = get$Cursor(state.selection);
    const node = dir === 'left' ? $cursor?.nodeBefore : $cursor?.nodeAfter;
    if (!$cursor || node?.type !== statusType(state.schema)) return null;

    const from = dir === 'left' ? $cursor.pos - node.nodeSize : $cursor.pos;
    return {from, to: from + node.nodeSize};
};

const moveCursorPastStatus =
    (dir: Direction): Command =>
    (state, dispatch) => {
        const status = findAdjacentStatus(state, dir);
        if (!status) return false;

        const pos = dir === 'left' ? status.from : status.to;
        dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, pos)));
        return true;
    };

const selectAdjacentStatus =
    (dir: Direction): Command =>
    (state, dispatch) => {
        const status = findAdjacentStatus(state, dir);
        if (!status) return false;

        dispatch?.(state.tr.setSelection(NodeSelection.create(state.doc, status.from)));
        return true;
    };

export const moveCursorLeftOfStatus = moveCursorPastStatus('left');
export const moveCursorRightOfStatus = moveCursorPastStatus('right');
export const selectStatusOnLeft = selectAdjacentStatus('left');
export const selectStatusOnRight = selectAdjacentStatus('right');

// The popover opens on a node selection, so plain arrows step past the badge.
export const statusKeymap: Keymap = {
    ArrowLeft: moveCursorLeftOfStatus,
    ArrowRight: moveCursorRightOfStatus,
    'Mod-ArrowLeft': selectStatusOnLeft,
    'Mod-ArrowRight': selectStatusOnRight,
};

import {chainCommands} from 'prosemirror-commands';
import type {NodeType} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection, TextSelection} from 'prosemirror-state';

import type {Keymap} from '../../../core';
import {get$Cursor, isNodeSelection} from '../../../utils/selection';

import {LabelAttr, type LabelColor, defaultLabelColor, labelType} from './LabelSpecs';
import {startLabelEdit} from './edit-state';

export type LabelAttrs = {
    [LabelAttr.Text]?: string;
    [LabelAttr.Color]?: LabelColor;
};

const canInsertLabel = (state: EditorState, type: NodeType): boolean => {
    const {$from, $to} = state.selection;
    const index = $from.index();

    return $from.sameParent($to) && $from.parent.canReplaceWith(index, index, type);
};

const findLabel = (state: EditorState, pos: number) => {
    const node = state.doc.nodeAt(pos);
    return node?.type === labelType(state.schema) ? node : null;
};

const isLabelSelected = ({selection, schema}: EditorState) =>
    isNodeSelection(selection) && selection.node.type === labelType(schema);

export const insertLabel =
    (text: string): Command =>
    (state, dispatch) => {
        const type = labelType(state.schema);
        if (!canInsertLabel(state, type)) return false;

        if (dispatch) {
            const {from, to} = state.selection;
            const tr = state.tr.replaceWith(
                from,
                to,
                type.create({[LabelAttr.Text]: text, [LabelAttr.Color]: defaultLabelColor}),
            );

            dispatch(startLabelEdit(tr, from).scrollIntoView());
        }

        return true;
    };

export const updateLabel =
    (pos: number, attrs: LabelAttrs): Command =>
    (state, dispatch) => {
        const node = findLabel(state, pos);
        if (!node) return false;

        if (dispatch) {
            const tr = state.tr.setNodeMarkup(pos, null, {...node.attrs, ...attrs});
            dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
        }

        return true;
    };

export const removeEmptyLabel =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = findLabel(state, pos);
        if (!node || node.attrs[LabelAttr.Text]) return false;

        if (dispatch) {
            const tr = state.tr.delete(pos, pos + node.nodeSize);
            dispatch(tr.setSelection(TextSelection.create(tr.doc, pos)));
        }

        return true;
    };

/** Moves the focus from the editor to the caption field of the selected label. */
export const editSelectedLabel: Command = (state, dispatch) => {
    if (!isLabelSelected(state)) return false;

    dispatch?.(startLabelEdit(state.tr, state.selection.from));
    return true;
};

type Direction = 'left' | 'right';

const selectAdjacentLabel =
    (dir: Direction): Command =>
    (state, dispatch) => {
        const $cursor = get$Cursor(state.selection);
        const node = dir === 'left' ? $cursor?.nodeBefore : $cursor?.nodeAfter;
        if (!$cursor || node?.type !== labelType(state.schema)) return false;

        const pos = dir === 'left' ? $cursor.pos - node.nodeSize : $cursor.pos;
        dispatch?.(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
        return true;
    };

const leaveSelectedLabel =
    (dir: Direction): Command =>
    (state, dispatch) => {
        if (!isLabelSelected(state)) return false;

        const pos = dir === 'left' ? state.selection.from : state.selection.to;
        dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, pos)));
        return true;
    };

export const selectLabelOnLeft = selectAdjacentLabel('left');
export const selectLabelOnRight = selectAdjacentLabel('right');
export const leaveLabelToLeft = leaveSelectedLabel('left');
export const leaveLabelToRight = leaveSelectedLabel('right');

// Arrows step through three positions: the edge before the label, the label itself, the edge after it.
// The selected label shows its popover and keeps the focus in the editor.
export const labelKeymap: Keymap = {
    ArrowLeft: chainCommands(leaveLabelToLeft, selectLabelOnLeft),
    ArrowRight: chainCommands(leaveLabelToRight, selectLabelOnRight),
    Enter: editSelectedLabel,
};

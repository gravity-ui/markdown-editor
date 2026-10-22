import type {NodeType} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection, TextSelection} from 'prosemirror-state';

import type {Keymap} from '../../../core';
import {
    createInlineAtomKeymap,
    isInlineAtomSelected,
    leaveSelectedInlineAtom,
    selectAdjacentInlineAtom,
} from '../../../plugins/InlineAtom';

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
                type.create({
                    [LabelAttr.Text]: state.doc.textBetween(from, to) || text,
                    [LabelAttr.Color]: defaultLabelColor,
                }),
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
        if (!node || node.attrs[LabelAttr.Text].trim()) return false;

        if (dispatch) {
            const tr = state.tr.delete(pos, pos + node.nodeSize);
            dispatch(tr.setSelection(TextSelection.create(tr.doc, pos)));
        }

        return true;
    };

/** Moves the focus from the editor to the caption field of the selected label. */
export const editSelectedLabel: Command = (state, dispatch) => {
    if (!isInlineAtomSelected(state, labelType)) return false;

    dispatch?.(startLabelEdit(state.tr, state.selection.from));
    return true;
};

export const selectLabelOnLeft = selectAdjacentInlineAtom(labelType, 'left');
export const selectLabelOnRight = selectAdjacentInlineAtom(labelType, 'right');
export const leaveLabelToLeft = leaveSelectedInlineAtom(labelType, 'left');
export const leaveLabelToRight = leaveSelectedInlineAtom(labelType, 'right');

export const labelKeymap: Keymap = createInlineAtomKeymap(labelType, editSelectedLabel);

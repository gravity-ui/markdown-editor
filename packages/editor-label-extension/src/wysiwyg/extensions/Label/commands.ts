import {InlineAtomPlugin} from '@gravity-ui/markdown-editor';
import type {Keymap} from '@gravity-ui/markdown-editor/core';
import type {Node, NodeType} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {type LabelColor, defaultLabelColor} from '@gravity-ui/markdown-plugin-label';

import {LabelAttr, labelNodeType} from './LabelSpecs';
import {startLabelEdit} from './plugins/LabelEditPlugin';

export type LabelAttrs = {
    [LabelAttr.Text]?: string;
    [LabelAttr.Color]?: LabelColor;
};

/** A selected label is edited instead of being replaced. */
const canInsertLabel = (state: EditorState, type: NodeType): boolean => {
    const {$from, $to} = state.selection;
    const index = $from.index();

    return (
        !InlineAtomPlugin.isInlineAtomSelected(state, labelNodeType) &&
        $from.sameParent($to) &&
        $from.parent.canReplaceWith(index, index, type)
    );
};

const findLabel = (state: EditorState, pos: number) => {
    const node = state.doc.nodeAt(pos);
    return node?.type === labelNodeType(state.schema) ? node : null;
};

/** A label inside the selected text keeps its caption in the new label. */
const labelCaption = (node: Node): string =>
    node.type === labelNodeType(node.type.schema) ? node.attrs[LabelAttr.Text] : '';

export const insertLabel =
    (text: string): Command =>
    (state, dispatch) => {
        const type = labelNodeType(state.schema);
        if (!canInsertLabel(state, type)) return false;

        if (dispatch) {
            // A selected node, such as an image, stays before the new label.
            const {to} = state.selection;
            const from = state.selection instanceof NodeSelection ? to : state.selection.from;
            const tr = state.tr.replaceWith(
                from,
                to,
                type.create({
                    [LabelAttr.Text]: state.doc.textBetween(from, to, '', labelCaption) || text,
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
    if (!InlineAtomPlugin.isInlineAtomSelected(state, labelNodeType)) return false;

    dispatch?.(startLabelEdit(state.tr, state.selection.from));
    return true;
};

export const selectLabelOnLeft = InlineAtomPlugin.selectAdjacentInlineAtom(labelNodeType, 'left');
export const selectLabelOnRight = InlineAtomPlugin.selectAdjacentInlineAtom(labelNodeType, 'right');
export const leaveLabelToLeft = InlineAtomPlugin.leaveSelectedInlineAtom(labelNodeType, 'left');
export const leaveLabelToRight = InlineAtomPlugin.leaveSelectedInlineAtom(labelNodeType, 'right');

export const labelKeymap: Keymap = InlineAtomPlugin.createInlineAtomKeymap(
    labelNodeType,
    editSelectedLabel,
);

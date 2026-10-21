import {chainCommands} from 'prosemirror-commands';
import type {NodeType, Schema} from 'prosemirror-model';
import {type Command, type EditorState, NodeSelection, TextSelection} from 'prosemirror-state';

import type {Keymap} from '../../core';
import {get$Cursor, isNodeSelection} from '../../utils/selection';

type GetNodeType = (schema: Schema) => NodeType;
export type Direction = 'left' | 'right';

export const isInlineAtomSelected = (state: EditorState, nodeType: GetNodeType): boolean =>
    isNodeSelection(state.selection) && state.selection.node.type === nodeType(state.schema);

export const selectAdjacentInlineAtom =
    (nodeType: GetNodeType, dir: Direction): Command =>
    (state, dispatch) => {
        const $cursor = get$Cursor(state.selection);
        const node = dir === 'left' ? $cursor?.nodeBefore : $cursor?.nodeAfter;
        if (!$cursor || node?.type !== nodeType(state.schema)) return false;

        const pos = dir === 'left' ? $cursor.pos - node.nodeSize : $cursor.pos;
        dispatch?.(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
        return true;
    };

export const leaveSelectedInlineAtom =
    (nodeType: GetNodeType, dir: Direction): Command =>
    (state, dispatch) => {
        if (!isInlineAtomSelected(state, nodeType)) return false;

        const pos = dir === 'left' ? state.selection.from : state.selection.to;
        dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, pos)));
        return true;
    };

/**
 * Arrows step through three positions: the edge before the atom, the atom itself, the edge after it.
 * The selected atom shows its popover and keeps the focus in the editor; `Enter` runs `edit`.
 */
export const createInlineAtomKeymap = (nodeType: GetNodeType, edit: Command): Keymap => ({
    ArrowLeft: chainCommands(
        leaveSelectedInlineAtom(nodeType, 'left'),
        selectAdjacentInlineAtom(nodeType, 'left'),
    ),
    ArrowRight: chainCommands(
        leaveSelectedInlineAtom(nodeType, 'right'),
        selectAdjacentInlineAtom(nodeType, 'right'),
    ),
    Enter: edit,
});

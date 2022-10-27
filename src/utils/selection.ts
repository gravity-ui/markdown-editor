import type {Node, NodeType, ResolvedPos} from 'prosemirror-model';
import {Selection, TextSelection, NodeSelection, AllSelection, Command} from 'prosemirror-state';
import type {NodeWithPos} from 'prosemirror-utils';
import {GapCursorSelection} from '../extensions/behavior/Cursor/GapCursorSelection';

NodeSelection.prototype.selectionName = 'NodeSelection';
TextSelection.prototype.selectionName = 'TextSelection';
AllSelection.prototype.selectionName = 'AllSelection';

export const isTextSelection = (selection: Selection): selection is TextSelection =>
    selection.selectionName === TextSelection.prototype.selectionName;

export const isNodeSelection = (selection: Selection): selection is NodeSelection =>
    selection.selectionName === NodeSelection.prototype.selectionName;

// ts broke down when use "selection is AllSelection" return type
// maybe because AllSelection has same class type with different constructor
export const isWholeSelection = (selection: Selection): boolean =>
    selection.selectionName === AllSelection.prototype.selectionName;

export const get$Cursor = (selection: Selection): ResolvedPos | null => {
    return isTextSelection(selection) ? selection.$cursor : null;
};

export const equalNodeType = function equalNodeType(nodeType: NodeType[] | NodeType, node: Node) {
    return (Array.isArray(nodeType) && nodeType.indexOf(node.type) > -1) || node.type === nodeType;
};

export const findSelectedNodeOfType = (nodeType: NodeType) => {
    return function (selection: Selection) {
        if (isNodeSelection(selection)) {
            const node = selection.node,
                $from = selection.$from;

            if (equalNodeType(nodeType, node)) {
                return {node: node, pos: $from.pos, depth: $from.depth};
            }
        }

        return null;
    };
};

export const createFakeParagraphNear: (direction: 'up' | 'down', parent?: NodeWithPos) => Command =
    (direction, parent) => (state, dispatch) => {
        const paragraph = state.schema.nodes.paragraph;

        if (!paragraph || !parent) {
            return false;
        }

        const insertPos = direction === 'up' ? parent.pos : parent.pos + parent.node.nodeSize;

        const tr = state.tr;
        const sel = new GapCursorSelection(tr.doc.resolve(insertPos));

        tr.setSelection(sel);

        if (dispatch) {
            dispatch(tr);
        }

        return true;
    };

import type {Node, NodeType, ResolvedPos} from 'prosemirror-model';
import {AllSelection, NodeSelection, Selection, TextSelection} from 'prosemirror-state';

export const isTextSelection = (selection: Selection): selection is TextSelection =>
    selection instanceof TextSelection;

export const isNodeSelection = (selection: Selection): selection is NodeSelection =>
    selection instanceof NodeSelection;

export const isWholeSelection = (selection: Selection): selection is AllSelection =>
    selection instanceof AllSelection;

export const get$Cursor = (selection: Selection): ResolvedPos | null => {
    return isTextSelection(selection) ? selection.$cursor : null;
};

export function get$CursorAtBlockStart(selection: Selection): ResolvedPos | null {
    const $cursor = get$Cursor(selection);
    if (!$cursor || $cursor.parentOffset > 0 || $cursor.parent.isInline) return null;
    return $cursor;
}

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

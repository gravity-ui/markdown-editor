import {Node, NodeType} from 'prosemirror-model';
import {Selection, TextSelection, NodeSelection, AllSelection} from 'prosemirror-state';

export const isTextSelection = (selection: Selection): selection is TextSelection =>
    // for some reason "instanceof" sometimes returns false
    selection.constructor.name === TextSelection.prototype.constructor.name;

export const isNodeSelection = (selection: Selection): selection is NodeSelection =>
    // for some reason "instanceof" sometimes returns false
    selection.constructor.name === NodeSelection.prototype.constructor.name;

// ts broke down when use "selection is AllSelection" return type
// maybe because AllSelection has same class type with different constructor
export const isWholeSelection = (selection: Selection): boolean =>
    // for some reason "instanceof" sometimes returns false
    selection.constructor.name === AllSelection.prototype.constructor.name;

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

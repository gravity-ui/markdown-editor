import {Selection, TextSelection, NodeSelection, AllSelection} from 'prosemirror-state';

export const isTextSelection = (selection: Selection): selection is TextSelection =>
    selection instanceof TextSelection;

export const isNodeSelection = (selection: Selection): selection is NodeSelection =>
    selection instanceof NodeSelection;

// ts broke down when use "selection is AllSelection" return type
// maybe because AllSelection has same class type with different constructor
export const isWholeSelection = (selection: Selection): boolean =>
    selection instanceof AllSelection;

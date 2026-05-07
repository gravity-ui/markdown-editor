import {toggleMark} from 'prosemirror-commands';
import type {MarkType, ResolvedPos} from 'prosemirror-model';
import type {EditorState, TextSelection, Transaction} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';

import {ColorSpecs, colorType} from './ColorSpecs';
import {type Colors, colorAction, colorMarkName} from './const';
import {parseStyleColorValue, validateClassNameColorName} from './utils';

import './colors.scss';

export {colorClassName, Colors} from './const';
export {colorMarkName, colorType} from './ColorSpecs';

export type ColorActionParams = {
    [colorMarkName]: string;
};

function getEffectiveMarks(state: EditorState, $pos: ResolvedPos = state.selection.$to) {
    return state.storedMarks ?? $pos.marks();
}

function selectionAllHasColor(state: EditorState, type: MarkType, color: string): boolean {
    let hasText = false;
    const allHave = state.selection.ranges.every(({$from, $to}) => {
        let rangeAllHave = true;
        state.doc.nodesBetween($from.pos, $to.pos, (node, _pos, parent) => {
            if (!rangeAllHave || !node.isText || !parent?.type.allowsMarkType(type)) {
                return rangeAllHave;
            }

            hasText = true;
            rangeAllHave = type.isInSet(node.marks)?.attrs[colorMarkName] === color;

            return rangeAllHave;
        });

        return rangeAllHave;
    });

    return hasText && allHave;
}

function toggleColorAtCursor(
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    type: MarkType,
    color?: string,
) {
    const {$cursor} = state.selection as TextSelection;
    if (!$cursor) return false;

    const storedMark = type.isInSet(getEffectiveMarks(state, $cursor));
    if (!color || storedMark?.attrs[colorMarkName] === color) {
        dispatch(state.tr.removeStoredMark(type));
    } else {
        dispatch(state.tr.addStoredMark(type.create({[colorMarkName]: color})));
    }

    return true;
}

function toggleColorInSelection(
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    type: MarkType,
    color?: string,
) {
    const tr = state.tr;

    if (color) {
        const allSameColor = selectionAllHasColor(state, type, color);
        state.selection.ranges.forEach(({$from, $to}) => {
            if (allSameColor) {
                tr.removeMark($from.pos, $to.pos, type);
            } else {
                tr.addMark($from.pos, $to.pos, type.create({[colorMarkName]: color}));
            }
        });
    } else {
        state.selection.ranges.forEach(({$from, $to}) => {
            tr.removeMark($from.pos, $to.pos, type);
        });
    }

    dispatch(tr.scrollIntoView());
    return true;
}

export const Color: ExtensionAuto = (builder) => {
    builder.use(ColorSpecs, {
        validateClassNameColorName,
        parseStyleColorValue,
    });

    builder.addAction(colorAction, ({schema}) => {
        const type = colorType(schema);
        return {
            isActive: (state) => Boolean(type.isInSet(getEffectiveMarks(state))),
            isEnable: toggleMark(type),
            run: (state, dispatch, _view, attrs) => {
                const color = (attrs as ColorActionParams | undefined)?.[colorMarkName];

                if (!dispatch) return true;

                if ((state.selection as TextSelection).empty) {
                    return toggleColorAtCursor(state, dispatch, type, color);
                }

                return toggleColorInSelection(state, dispatch, type, color);
            },
            meta(state): Colors {
                return type.isInSet(getEffectiveMarks(state))?.attrs[colorMarkName];
            },
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [colorAction]: Action<ColorActionParams, Colors>;
        }
    }
}

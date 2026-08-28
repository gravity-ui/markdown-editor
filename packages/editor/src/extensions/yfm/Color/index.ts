import {toggleMark} from 'prosemirror-commands';
import type {MarkType, ResolvedPos} from 'prosemirror-model';
import type {EditorState, TextSelection, Transaction} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {isMarkActive} from '../../../utils/marks';

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

function rangeSelectionTextIsWhitespaceOnly(
    text: string | undefined,
    from: number,
    to: number,
    nodePos: number,
) {
    const selectedText = text?.slice(Math.max(0, from - nodePos), Math.max(0, to - nodePos)) ?? '';

    return /^\s*$/.test(selectedText);
}

function selectionAllHasColor(state: EditorState, type: MarkType, color: string): boolean {
    let hasText = false;
    const allHave = state.selection.ranges.every(({$from, $to}) => {
        let rangeAllHave = true;
        state.doc.nodesBetween($from.pos, $to.pos, (node, pos, parent) => {
            if (!rangeAllHave || !node.isText || !parent?.type.allowsMarkType(type)) {
                return rangeAllHave;
            }

            if (rangeSelectionTextIsWhitespaceOnly(node.text, $from.pos, $to.pos, pos)) {
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
                let from = $from.pos;
                let to = $to.pos;
                const start = $from.nodeAfter;
                const end = $to.nodeBefore;
                const spaceStart = start?.isText ? /^\s*/.exec(start.text)?.[0].length ?? 0 : 0;
                const spaceEnd = end?.isText ? /\s*$/.exec(end.text)?.[0].length ?? 0 : 0;

                if (from + spaceStart < to) {
                    from += spaceStart;
                    to -= spaceEnd;
                    tr.addMark(from, to, type.create({[colorMarkName]: color}));
                }
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
            isActive: (state) => Boolean(isMarkActive(state, type)),
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

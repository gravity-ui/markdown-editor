import {toggleMark} from 'prosemirror-commands';
import {TextSelection} from 'prosemirror-state';

import type {Action, ExtensionAuto} from '../../../core';
import {selectionAllHasMarkWithAttr} from '../../../utils/marks';

import {ColorSpecs, colorType} from './ColorSpecs';
import {type Colors, colorAction, colorMarkName} from './const';
import {parseStyleColorValue, validateClassNameColorName} from './utils';

import './colors.scss';

export {colorClassName, Colors} from './const';
export {colorMarkName, colorType} from './ColorSpecs';

export type ColorActionParams = {
    [colorMarkName]: string;
};

export const Color: ExtensionAuto = (builder) => {
    builder.use(ColorSpecs, {
        validateClassNameColorName,
        parseStyleColorValue,
    });

    builder.addAction(colorAction, ({schema}) => {
        const type = colorType(schema);
        return {
            isActive: (state) =>
                Boolean(type.isInSet(state.storedMarks ?? state.selection.$to.marks())),
            isEnable: toggleMark(type),
            run: (state, dispatch, _view, attrs) => {
                const params = attrs as ColorActionParams | undefined;
                const color = params?.[colorMarkName];

                if (dispatch) {
                    const {empty, $cursor} = state.selection as TextSelection;

                    if (empty && $cursor) {
                        // cursor only — toggle stored marks
                        const storedMark = type.isInSet(state.storedMarks ?? $cursor.marks());
                        if (!color || storedMark?.attrs[colorMarkName] === color) {
                            dispatch(state.tr.removeStoredMark(type));
                        } else {
                            dispatch(
                                state.tr.addStoredMark(type.create({[colorMarkName]: color})),
                            );
                        }
                        return true;
                    }

                    const tr = state.tr;
                    if (!color) {
                        // "default" / remove color: always strip
                        state.selection.ranges.forEach(({$from, $to}) =>
                            tr.removeMark($from.pos, $to.pos, type),
                        );
                    } else {
                        const allSameColor = selectionAllHasMarkWithAttr(
                            state,
                            type,
                            colorMarkName,
                            color,
                        );
                        state.selection.ranges.forEach(({$from, $to}) => {
                            if (allSameColor) {
                                tr.removeMark($from.pos, $to.pos, type);
                            } else {
                                // addMark replaces any existing color mark (same type = mutually exclusive)
                                tr.addMark(
                                    $from.pos,
                                    $to.pos,
                                    type.create({[colorMarkName]: color}),
                                );
                            }
                        });
                    }
                    dispatch(tr.scrollIntoView());
                }
                return true;
            },
            meta(state): Colors {
                return type.isInSet(state.storedMarks ?? state.selection.$to.marks())?.attrs[
                    colorMarkName
                ];
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

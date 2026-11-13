import {toggleMark} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';
import {isMarkActive} from '../../../utils/marks';

import {ColorSpecs, colorType} from './ColorSpecs';
import {type Colors, colorAction, colorMarkName} from './const';
import {chainAND, parseStyleColorValue, validateClassNameColorName} from './utils';

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
            isActive: (state) => Boolean(isMarkActive(state, type)),
            isEnable: toggleMark(type),
            run: (state, dispatch, _view, attrs) => {
                const params = attrs as ColorActionParams | undefined;
                const hasMark = isMarkActive(state, type);

                if (!params || !params[colorMarkName]) {
                    if (!hasMark) return true;

                    // remove mark
                    return toggleMark(type, params)(state, dispatch);
                }

                if (hasMark) {
                    // remove old mark, then add new with new color
                    return chainAND(toggleMark(type), toggleMark(type, params))(state, dispatch);
                }

                // add mark
                return toggleMark(type, params)(state, dispatch);
            },
            meta(state): Colors | null | undefined {
                const {selection, storedMarks} = state;
                if (selection.empty) {
                    return type.isInSet(storedMarks ?? selection.$from.marks())?.attrs[
                        colorMarkName
                    ];
                }

                const colors = new Set<Colors | undefined>();
                for (const {$from, $to} of selection.ranges) {
                    state.doc.nodesBetween($from.pos, $to.pos, (node) => {
                        if (colors.size > 1) return false;
                        if (node.isInline)
                            colors.add(type.isInSet(node.marks)?.attrs[colorMarkName]);
                        return true;
                    });
                    if (colors.size > 1) return null;
                }
                return colors.values().next().value;
            },
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            /**
             * Sets the text color. An empty color clears it.
             * `meta()` returns:
             * - `Colors`: one color for all selected inline content.
             * - `null`: mixed colors, including colored and plain content.
             * - `undefined`: no text color is set.
             * At a cursor, `meta()` reads stored marks, or cursor marks if none are stored.
             */
            [colorAction]: Action<ColorActionParams, Colors | null | undefined>;
        }
    }
}

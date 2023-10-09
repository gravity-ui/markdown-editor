import {toggleMark} from 'prosemirror-commands';
import type {Action, ExtensionAuto} from '../../../core';
import {isMarkActive} from '../../../utils/marks';
import {ColorSpecs, colorType} from './ColorSpecs';
import {colorAction, colorMarkName, Colors} from './const';
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
            meta(state): Colors {
                return type.isInSet(state.selection.$to.marks())?.attrs[colorMarkName];
            },
        };
    });
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [colorAction]: Action<ColorActionParams, Colors>;
        }
    }
}

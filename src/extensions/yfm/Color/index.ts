import mdPlugin from 'markdown-it-color';
import {toggleMark} from 'prosemirror-commands';
import {Action, createExtension, ExtensionAuto} from '../../../core';
import {isMarkActive} from '../../../utils/marks';
import {markTypeFactory} from '../../../utils/schema';
import {className, color, colorAction, Colors, domColorAttr} from './const';
import {chainAND} from './utils';

import './colors.scss';

const colorType = markTypeFactory(color);

export {className as colorClassName, Colors} from './const';

export type ColorActionParams = {
    [color]: string;
};

export const Color: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(mdPlugin, {defaultClassName: className, inline: false}))
        .addMark(color, () => ({
            spec: {
                attrs: {[color]: {}},
                parseDOM: [
                    {
                        tag: `span[${domColorAttr}]`,
                        getAttrs(node) {
                            return {
                                [color]: (node as HTMLElement).getAttribute(domColorAttr),
                            };
                        },
                    },
                ],
                toDOM(node) {
                    const colorValue = node.attrs[color];

                    return [
                        'span',
                        {
                            class: [className, `${className}--${colorValue}`].join(' '),
                            [domColorAttr]: colorValue,
                        },
                        0,
                    ];
                },
            },
            fromYfm: {
                tokenSpec: {
                    name: color,
                    type: 'mark',
                    getAttrs(token) {
                        return {
                            [color]: token.info,
                        };
                    },
                },
            },
            toYfm: {
                open: (_state, mark) => {
                    return `{${mark.attrs[color]}}(`;
                },
                close: ')',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }))
        .addAction(colorAction, ({schema}) => {
            const type = colorType(schema);

            return {
                isActive: (state) => Boolean(isMarkActive(state, type)),
                isEnable: toggleMark(type),
                run: (state, dispatch, _view, attrs) => {
                    const params = attrs as ColorActionParams | undefined;
                    const hasMark = isMarkActive(state, type);

                    if (!params || !params[color]) {
                        if (!hasMark) return true;

                        // remove mark
                        return toggleMark(type, params)(state, dispatch);
                    }

                    if (hasMark) {
                        // remove old mark, then add new with new color
                        return chainAND(toggleMark(type), toggleMark(type, params))(
                            state,
                            dispatch,
                        );
                    }

                    // add mark
                    return toggleMark(type, params)(state, dispatch);
                },
                meta(state): Colors {
                    return type.isInSet(state.selection.$to.marks())?.attrs[color];
                },
            };
        });
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const ColorE = createExtension((b) => b.use(Color));

declare global {
    namespace YfmEditor {
        interface Actions {
            [colorAction]: Action<ColorActionParams, Colors>;
        }
    }
}

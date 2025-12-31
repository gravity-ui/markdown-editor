import type MarkdownIt from 'markdown-it';

import color from 'src/markdown-it/color';

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

import {colorClassName, colorMarkName, domColorAttr} from './const';

export {colorMarkName} from './const';
export const colorType = markTypeFactory(colorMarkName);

function getColorName(className: string) {
    const regexp = /^(yfm|md)-colorify--(\w+)$/;
    return className.match(regexp)?.[2];
}

export type ColorSpecsOptions = {
    validateClassNameColorName?: (colorName: string) => boolean;
    parseStyleColorValue?: (color: string) => string | null;
};

export const ColorSpecs: ExtensionAuto<ColorSpecsOptions> = (builder, opts) => {
    const {validateClassNameColorName, parseStyleColorValue} = opts;
    const mdPlugin = (md: MarkdownIt) =>
        md.use(color, {escape: true, defaultClassName: colorClassName});

    builder
        .configureMd((md) => md.use(mdPlugin, {defaultClassName: colorClassName, inline: false}))
        .addMark(colorMarkName, () => ({
            spec: {
                attrs: {[colorMarkName]: {}},
                parseDOM: [
                    {
                        tag: `span`,
                        preserveWhitespace: false,
                        getAttrs(node) {
                            if (typeof node === 'string') return false;

                            for (const className of Array.from(node.classList)) {
                                const color = getColorName(className);
                                if (color && (validateClassNameColorName?.(color) ?? true)) {
                                    return {
                                        [colorMarkName]: color,
                                    };
                                }
                            }

                            return false;
                        },
                    },
                    {
                        style: 'color',
                        preserveWhitespace: false,
                        getAttrs(node) {
                            if (typeof node !== 'string') return false;

                            const color = parseStyleColorValue?.(node);
                            if (color) {
                                return {
                                    [colorMarkName]: color,
                                };
                            }

                            return false;
                        },
                    },
                ],
                toDOM(node) {
                    const colorValue = node.attrs[colorMarkName];

                    return [
                        'span',
                        {
                            class: [colorClassName, `${colorClassName}--${colorValue}`].join(' '),
                            [domColorAttr]: colorValue,
                        },
                        0,
                    ];
                },
            },
            fromMd: {
                tokenSpec: {
                    name: colorMarkName,
                    type: 'mark',
                    getAttrs(token) {
                        return {
                            [colorMarkName]: token.info,
                        };
                    },
                },
            },
            toMd: {
                open: (state, mark) => {
                    state.escapeCharacters = ['(', ')'];
                    return `{${mark.attrs[colorMarkName]}}(`;
                },
                close: (state) => {
                    state.escapeCharacters = undefined;
                    return `)`;
                },
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }));
};

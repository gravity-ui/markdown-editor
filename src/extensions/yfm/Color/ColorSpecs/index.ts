import mdPlugin from 'markdown-it-color';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';
import {colorMarkName, colorClassName, domColorAttr} from './const';

export {colorMarkName} from './const';
export const colorType = markTypeFactory(colorMarkName);

export const ColorSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(mdPlugin, {defaultClassName: colorClassName, inline: false}))
        .addMark(colorMarkName, () => ({
            spec: {
                attrs: {[colorMarkName]: {}},
                parseDOM: [
                    {
                        tag: `span[${domColorAttr}]`,
                        getAttrs(node) {
                            return {
                                [colorMarkName]: (node as HTMLElement).getAttribute(domColorAttr),
                            };
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
            fromYfm: {
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
            toYfm: {
                open: (_state, mark) => {
                    return `{${mark.attrs[colorMarkName]}}(`;
                },
                close: ')',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }));
};

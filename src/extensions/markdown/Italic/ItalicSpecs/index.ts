import type {ExtensionAuto} from '#core';
import type {Mark} from '#pm/model';
import {markTypeFactory} from 'src/utils/schema';

export const italicMarkName = 'em';
export const italicType = markTypeFactory(italicMarkName);
export const ItalicAttrs = {
    Markup: 'data-markup',
} as const;
const defaultMarkup = '*';

export const ItalicSpecs: ExtensionAuto = (builder) => {
    builder.addMark(italicMarkName, () => ({
        spec: {
            attrs: {[ItalicAttrs.Markup]: {default: defaultMarkup}},
            parseDOM: [
                {tag: 'i'},
                {
                    tag: 'em',
                    getAttrs: (node) => ({
                        [ItalicAttrs.Markup]: node.getAttribute(ItalicAttrs.Markup),
                    }),
                },
                {style: 'font-style', getAttrs: (value) => value === 'italic' && null},
            ],
            toDOM(mark) {
                return ['em', mark.attrs];
            },
        },
        toMd: {open: getMarkup, close: getMarkup, mixable: true, expelEnclosingWhitespace: true},
        fromMd: {
            tokenSpec: {
                name: italicMarkName,
                type: 'mark',
                getAttrs: (token) => ({
                    [ItalicAttrs.Markup]: token.markup,
                }),
            },
        },
    }));
};

function getMarkup(_: unknown, mark: Mark): string {
    const attr = mark.attrs[ItalicAttrs.Markup];
    return attr || defaultMarkup;
}

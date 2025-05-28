import type {ExtensionAuto} from '#core';
import type {Mark} from '#pm/model';
import {markTypeFactory} from 'src/utils/schema';

export const boldMarkName = 'strong';
export const boldType = markTypeFactory(boldMarkName);
export const BoldAttrs = {
    Markup: 'data-markup',
} as const;
const defaultMarkup = '**';

export const BoldSpecs: ExtensionAuto = (builder) => {
    builder.addMark(boldMarkName, () => ({
        spec: {
            attrs: {[BoldAttrs.Markup]: {default: defaultMarkup}},
            parseDOM: [
                {tag: 'b'},
                {
                    tag: 'strong',
                    getAttrs: (node) => ({
                        [BoldAttrs.Markup]: node.getAttribute(BoldAttrs.Markup),
                    }),
                },
                {
                    style: 'font-weight',
                    getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
                },
            ],
            toDOM(mark) {
                return ['strong', mark.attrs];
            },
        },
        fromMd: {
            tokenSpec: {
                name: boldMarkName,
                type: 'mark',
                getAttrs: (token) => ({
                    [BoldAttrs.Markup]: token.markup,
                }),
            },
        },
        toMd: {open: getMarkup, close: getMarkup, mixable: true, expelEnclosingWhitespace: true},
    }));
};

function getMarkup(_: unknown, mark: Mark): string {
    const attr = mark.attrs[BoldAttrs.Markup];
    return attr || defaultMarkup;
}

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const boldMarkName = 'strong';
export const boldType = markTypeFactory(boldMarkName);

export const BoldSpecs: ExtensionAuto = (builder) => {
    builder.addMark(boldMarkName, () => ({
        spec: {
            parseDOM: [
                {tag: 'b'},
                {tag: 'strong'},
                {
                    style: 'font-weight',
                    getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
                },
            ],
            toDOM() {
                return ['strong'];
            },
        },
        fromYfm: {
            tokenSpec: {
                name: boldMarkName,
                type: 'mark',
            },
        },
        toYfm: {open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true},
    }));
};

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const italicMarkName = 'em';
export const italicType = markTypeFactory(italicMarkName);

export const ItalicSpecs: ExtensionAuto = (builder) => {
    builder.addMark(italicMarkName, () => ({
        spec: {
            parseDOM: [
                {tag: 'i'},
                {tag: 'em'},
                {style: 'font-style', getAttrs: (value) => value === 'italic' && null},
            ],
            toDOM() {
                return ['em'];
            },
        },
        toYfm: {open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true},
        fromYfm: {tokenSpec: {name: italicMarkName, type: 'mark'}},
    }));
};

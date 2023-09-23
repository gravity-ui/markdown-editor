import markPlugin from 'markdown-it-mark';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const markMarkName = 'mark';
export const markMarkType = markTypeFactory(markMarkName);

export const MarkSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(markPlugin))
        .addMark(markMarkName, () => ({
            spec: {
                parseDOM: [{tag: 'mark'}],
                toDOM() {
                    return ['mark'];
                },
            },
            fromYfm: {
                tokenSpec: {
                    name: markMarkName,
                    type: 'mark',
                },
            },
            toYfm: {
                open: '==',
                close: '==',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }));
};

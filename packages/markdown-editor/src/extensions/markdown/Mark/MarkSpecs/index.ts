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
            fromMd: {
                tokenSpec: {
                    name: markMarkName,
                    type: 'mark',
                },
            },
            toMd: {
                open: '==',
                close: '==',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        }));
};

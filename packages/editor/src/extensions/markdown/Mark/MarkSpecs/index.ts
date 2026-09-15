import markPlugin from 'markdown-it-mark';

import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';

export const markMarkName = 'mark';
export const markMarkType = markTypeFactory(markMarkName);

export const MarkSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(markPlugin))
        .addMarkSpec(markMarkName, () => ({
            parseDOM: [{tag: 'mark'}],
            toDOM() {
                return ['mark'];
            },
        }))
        .addMarkdownTokenParserSpec('mark', () => ({
            name: markMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(markMarkName, () => ({
            open: '==',
            close: '==',
            mixable: true,
            expelEnclosingWhitespace: true,
        }));
};

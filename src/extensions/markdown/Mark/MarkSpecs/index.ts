import type {PluginSimple} from 'markdown-it';
import type {ExtensionAuto} from '../../../../core';
import {markTypeFactory} from '../../../../utils/schema';
const mdPlugin: PluginSimple = require('markdown-it-mark');

export const markMarkName = 'mark';
export const markMarkType = markTypeFactory(markMarkName);

export const MarkSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(mdPlugin))
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

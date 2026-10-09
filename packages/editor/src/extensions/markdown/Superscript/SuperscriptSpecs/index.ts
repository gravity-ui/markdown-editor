import {log} from '@diplodoc/transform/lib/log.js';
import sup from '@diplodoc/transform/lib/plugins/sup.js';

import type {ExtensionAuto} from '#core';
import {markTypeFactory} from 'src/utils/schema';

export const superscriptMarkName = 'sup';
export const superscriptType = markTypeFactory(superscriptMarkName);

export const SuperscriptSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sup, {log}))
        .addMarkSpec(superscriptMarkName, () => ({
            excludes: '_',
            parseDOM: [{tag: 'sup'}],
            toDOM() {
                return ['sup'];
            },
        }))
        .addMarkdownTokenParserSpec('sup', () => ({
            name: superscriptMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(superscriptMarkName, () => ({
            open: (state) => {
                state.escapeWhitespace = true;
                return '^';
            },
            close: (state) => {
                state.escapeWhitespace = false;
                return '^';
            },
            mixable: true,
            expelEnclosingWhitespace: true,
        }));
};

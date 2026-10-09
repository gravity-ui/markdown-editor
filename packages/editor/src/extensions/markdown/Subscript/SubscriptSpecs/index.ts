import subPlugin from 'markdown-it-sub';

import type {ExtensionAuto} from '#core';
import {markTypeFactory} from 'src/utils/schema';

export const subscriptMarkName = 'sub';
export const subscriptType = markTypeFactory(subscriptMarkName);

export const SubscriptSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(subPlugin))
        .addMarkSpec(subscriptMarkName, () => ({
            excludes: '_',
            parseDOM: [{tag: 'sub'}],
            toDOM() {
                return ['sub'];
            },
        }))
        .addMarkdownTokenParserSpec('sub', () => ({
            name: subscriptMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(subscriptMarkName, () => ({
            open: (state) => {
                state.escapeWhitespace = true;
                return '~';
            },
            close: (state) => {
                state.escapeWhitespace = false;
                return '~';
            },
            mixable: false,
            expelEnclosingWhitespace: true,
        }));
};

import insPlugin from 'markdown-it-ins';

import type {ExtensionAuto} from '#core';
import {markTypeFactory} from 'src/utils/schema';

export const underlineMarkName = 'ins';
export const underlineType = markTypeFactory(underlineMarkName);

export const UnderlineSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(insPlugin))
        .addMarkSpec(underlineMarkName, () => ({
            parseDOM: [{tag: 'ins'}, {tag: 'u'}],
            toDOM() {
                return ['ins'];
            },
        }))
        .addMarkdownTokenParserSpec('ins', () => ({
            name: underlineMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(underlineMarkName, () => ({
            open: '++',
            close: '++',
            mixable: true,
            expelEnclosingWhitespace: true,
        }));
};

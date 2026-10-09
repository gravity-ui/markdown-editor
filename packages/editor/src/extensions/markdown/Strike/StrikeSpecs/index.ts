import type {ExtensionAuto} from '#core';
import {markTypeFactory} from 'src/utils/schema';

export const strikeMarkName = 'strike';
export const strikeType = markTypeFactory(strikeMarkName);

export const StrikeSpecs: ExtensionAuto = (builder) => {
    builder
        .addMarkSpec(strikeMarkName, () => ({
            parseDOM: [{tag: 'strike'}, {tag: 's'}],
            toDOM() {
                return ['strike'];
            },
        }))
        .addMarkdownTokenParserSpec('s', () => ({
            name: strikeMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(strikeMarkName, () => ({
            open: '~~',
            close: '~~',
            mixable: true,
            expelEnclosingWhitespace: true,
        }));
};

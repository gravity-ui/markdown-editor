import type {ExtensionAuto} from '#core';
import spoilerPlugin, {SPOILER_MARKUP, SPOILER_TOKEN} from 'src/markdown-it/spoiler';
import {markTypeFactory} from 'src/utils/schema';

import {SpoilerClassName, spoilerMarkName} from './const';

export {SpoilerClassName, spoilerMarkName} from './const';
export const spoilerType = markTypeFactory(spoilerMarkName);

export const SpoilerSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(spoilerPlugin))
        .addMarkSpec(
            spoilerMarkName,
            () => ({
                parseDOM: [{tag: `span.${SpoilerClassName.Spoiler}`}],
                toDOM() {
                    return [
                        'span',
                        {class: SpoilerClassName.Spoiler},
                        ['span', {class: SpoilerClassName.Content}, 0],
                    ];
                },
            }),
            // The spoiler wraps links and other marks, so its content stays in one directive
            builder.Priority.VeryHigh,
        )
        .addMarkdownTokenParserSpec(SPOILER_TOKEN, () => ({
            name: spoilerMarkName,
            type: 'mark',
        }))
        .addMarkSerializerSpec(spoilerMarkName, () => ({
            open: `${SPOILER_MARKUP}[`,
            close: ']',
        }));
};

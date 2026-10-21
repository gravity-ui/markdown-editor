import {directiveParser, registerInlineDirective, tokenizeInlineContent} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

export const SPOILER_DIRECTIVE = 'spoiler';
export const SPOILER_MARKUP = `:${SPOILER_DIRECTIVE}`;
/** Tokens are named `spoiler_open` and `spoiler_close` */
export const SPOILER_TOKEN = 'spoiler';

export const SpoilerClassName = {
    Spoiler: 'yfm-spoiler',
    Content: 'yfm-spoiler__content',
    Revealed: 'yfm-spoiler_revealed',
} as const;

/**
 * Inline spoiler in the directive syntax: `:spoiler[hidden text]`.
 * The content in square brackets is parsed as inline markdown.
 */
const spoiler: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerInlineDirective(md, SPOILER_DIRECTIVE, (state, params) => {
        const {content} = params;
        // The content must follow the directive name right away
        if (!content?.raw || state.src.charCodeAt(content.startPos - 1) !== 0x5b /* [ */) {
            return false;
        }

        const open = state.push(`${SPOILER_TOKEN}_open`, 'span', 1);
        open.markup = SPOILER_MARKUP;
        open.attrSet('class', SpoilerClassName.Spoiler);

        tokenizeInlineContent(state, content);

        const close = state.push(`${SPOILER_TOKEN}_close`, 'span', -1);
        close.markup = SPOILER_MARKUP;

        // The spoiler has no destinations or attributes.
        // The parser consumes them as a part of the directive, so they are parsed as plain inline content.
        const restStart = content.endPos + 1;
        if (restStart < params.endPos) {
            tokenizeInlineContent(state, {
                raw: state.src.slice(restStart, params.endPos),
                startPos: restStart,
                endPos: params.endPos,
            });
        }

        return true;
    });

    const {rules} = md.renderer;
    rules[`${SPOILER_TOKEN}_open`] = (tokens, idx, _opts, _env, self) =>
        `<span${self.renderAttrs(tokens[idx])}><span class="${SpoilerClassName.Content}">`;
    rules[`${SPOILER_TOKEN}_close`] = () => '</span></span>';
};

export default spoiler;

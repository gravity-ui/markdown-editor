import {TokenType} from '@diplodoc/folding-headings-extension';
import type {PluginSimple} from 'markdown-it';

const ignoreTokenTypes: readonly string[] = [
    TokenType.SectionOpen,
    TokenType.SectionClose,
    TokenType.ContentOpen,
    TokenType.ContentClose,
];

/** Filter heading section tokens, which are not needed in prosemirror-document */
export const skipSectionsPlugin: PluginSimple = (md) => {
    md.core.ruler.push('skip-heading-sections', (state) => {
        state.tokens = state.tokens.filter((token) => !ignoreTokenTypes.includes(token.type));
    });
};

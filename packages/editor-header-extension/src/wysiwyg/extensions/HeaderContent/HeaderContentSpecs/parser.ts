import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerContentPlugin,
    headerContentTokenName,
    headerTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName} from './const';

const contentOpen = `${headerContentTokenName}_open`;
const headerOpen = `${headerTokenName}_open`;

/**
 * The editor keeps a description only as a child block of a banner: another one becomes its blocks.
 * The plugin already drops the descriptions after the first one in a banner.
 */
function unwrapOutsideHeader<T extends {type: string; nesting: number}>(tokens: T[]) {
    const unwrapped: boolean[] = [];
    const parents: string[] = [];
    return tokens.filter((token) => {
        if (token.nesting < 0) {
            parents.pop();
            return !unwrapped.pop();
        }
        if (token.nesting === 0) return true;
        const unwrap = token.type === contentOpen && parents[parents.length - 1] !== headerOpen;
        parents.push(token.type);
        unwrapped.push(unwrap);
        return !unwrap;
    });
}

export const HeaderContentParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => {
            md.use(headerContentPlugin);
            md.core.ruler.push('g_md_header_content_in_header', (state) => {
                const tokens = unwrapOutsideHeader(state.tokens);
                if (tokens.length !== state.tokens.length) {
                    state.tokens.splice(0, Infinity, ...tokens);
                }
                return true;
            });
            return md;
        })
        .addMarkdownTokenParserSpec(headerContentTokenName, () => ({
            name: headerContentNodeName,
            type: 'block',
        }));
};

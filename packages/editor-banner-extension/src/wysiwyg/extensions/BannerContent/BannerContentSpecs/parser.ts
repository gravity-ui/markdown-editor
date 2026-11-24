import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    bannerContentPlugin,
    bannerContentTokenName,
    bannerTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerContentNodeName} from './const';

const contentOpen = `${bannerContentTokenName}_open`;
const bannerOpen = `${bannerTokenName}_open`;

/**
 * The editor keeps a description only as a child block of a banner: another one becomes its blocks.
 * The plugin already drops the descriptions after the first one in a banner.
 */
function unwrapOutsideBanner<T extends {type: string; nesting: number}>(tokens: T[]) {
    const unwrapped: boolean[] = [];
    const parents: string[] = [];
    return tokens.filter((token) => {
        if (token.nesting < 0) {
            parents.pop();
            return !unwrapped.pop();
        }
        if (token.nesting === 0) return true;
        const unwrap = token.type === contentOpen && parents[parents.length - 1] !== bannerOpen;
        parents.push(token.type);
        unwrapped.push(unwrap);
        return !unwrap;
    });
}

export const BannerContentParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => {
            md.use(bannerContentPlugin);
            md.core.ruler.push('g_md_banner_content_in_banner', (state) => {
                const tokens = unwrapOutsideBanner(state.tokens);
                if (tokens.length !== state.tokens.length) {
                    state.tokens.splice(0, Infinity, ...tokens);
                }
                return true;
            });
            return md;
        })
        .addMarkdownTokenParserSpec(bannerContentTokenName, () => ({
            name: bannerContentNodeName,
            type: 'block',
        }));
};

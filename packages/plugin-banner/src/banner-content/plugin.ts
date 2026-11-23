import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

import {bannerTokenName} from '../banner/const';
import {bannerTitleTokenName} from '../banner-title/model';

import {bannerContentAttrs} from './attrs';
import {bannerContentDirectiveName, bannerContentTokenName} from './model';

const contentOpen = `${bannerContentTokenName}_open`;
const contentClose = `${bannerContentTokenName}_close`;
const bannerOpen = `${bannerTokenName}_open`;

type Parent = {type: string; unwrap: boolean; described: boolean; inBanner: boolean};

/**
 * A banner holds one description: its first child block of the kind.
 * Another description in the banner, also one nested in another block, loses its container,
 * and its blocks stay in place. A description outside a banner is kept.
 */
function keepOneDescriptionPerBanner(state: StateCore) {
    const parents: Parent[] = [];
    const tokens = state.tokens.filter((token) => {
        if (token.nesting < 0) return !parents.pop()?.unwrap;
        if (token.nesting === 0) return true;
        const parent = parents[parents.length - 1];
        let unwrap = false;
        if (token.type === contentOpen && parent?.inBanner) {
            unwrap = parent.type !== bannerOpen || parent.described;
            if (!unwrap) parent.described = true;
        }
        const inBanner = token.type === bannerOpen || Boolean(parent?.inBanner);
        parents.push({type: token.type, unwrap, described: false, inBanner});
        return !unwrap;
    });
    if (tokens.length !== state.tokens.length) {
        state.tokens.splice(0, Infinity, ...keepOneTitlePerBanner(state, tokens));
    }
}

/** The source lines of a block token as a paragraph, the way a second title of a banner is read. */
function asParagraph(state: StateCore, block: Token): Token[] {
    const [start, end] = block.map ?? [0, 0];
    const open = new state.Token('paragraph_open', 'p', 1);
    const inline = new state.Token('inline', '', 0);
    const close = new state.Token('paragraph_close', 'p', -1);
    inline.content = state.src.split('\n').slice(start, end).join('\n').trim();
    inline.children = [];
    for (const token of [open, inline, close]) {
        token.block = true;
        token.map = block.map;
        token.level = block.level;
    }
    inline.level = block.level + 1;
    return [open, inline, close];
}

/**
 * The blocks of an unwrapped description become blocks of the banner. A title among them
 * after the title of the banner stays text, like a second title written in the banner.
 */
function keepOneTitlePerBanner(state: StateCore, tokens: Token[]) {
    const parents: {type: string; titled: boolean}[] = [];
    return tokens.flatMap((token) => {
        if (token.nesting < 0) {
            parents.pop();
            return [token];
        }
        const parent = parents[parents.length - 1];
        if (token.nesting > 0) {
            parents.push({type: token.type, titled: false});
            return [token];
        }
        if (token.type !== bannerTitleTokenName || parent?.type !== bannerOpen) return [token];
        if (!parent.titled) {
            parent.titled = true;
            return [token];
        }
        return asParagraph(state, token);
    });
}

const registered = new WeakSet<object>();

export const bannerContentPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: bannerContentDirectiveName,
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {tag: 'div', token: bannerContentTokenName, attrs: bannerContentAttrs},
    });
    if (!registered.has(md)) {
        registered.add(md);
        md.core.ruler.after('block', 'g_md_banner_content_one', keepOneDescriptionPerBanner);
    }
    // An empty description renders nothing, so it takes no space.
    const {rules} = md.renderer;
    rules[contentOpen] = (tokens, idx, options, _env, self) =>
        tokens[idx + 1]?.type === contentClose ? '' : self.renderToken(tokens, idx, options);
    rules[contentClose] = (tokens, idx, options, _env, self) =>
        tokens[idx - 1]?.type === contentOpen ? '' : self.renderToken(tokens, idx, options);
};

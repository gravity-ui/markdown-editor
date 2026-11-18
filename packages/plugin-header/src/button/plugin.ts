import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {normalizeLinkUrl} from '../url';

import {buttonAttrs} from './attrs';
import {buttonTokenName} from './model';

const buttonWithoutLabel = /:button(?![[\w-])/iy;

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    // markdown-it-directive 2.0.6 reads the label of `:button` without `[`, also inside a link,
    // where the handler is not called: https://github.com/hilookas/markdown-it-directive/issues/16
    md.inline.ruler.before('inline_directive', 'g_md_button_without_label', (state, silent) => {
        buttonWithoutLabel.lastIndex = state.pos;
        if (!buttonWithoutLabel.test(state.src)) return false;
        if (!silent) state.pending += ':';
        state.pos++;
        return true;
    });
    registerInlineDirective(md, 'button', (state, {content, dests, attrs}) => {
        if (!content) return false;
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = md.utils.unescapeMd(content.raw).trim();
        token.attrs = Object.entries(
            buttonAttrs({...attrs, href: normalizeLinkUrl(md, dests?.link), title: dests?.string}),
        );
        return true;
    });
    const {rules} = md.renderer;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</a>`;
    };
};

import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {normalizeLinkUrl} from '../url';

import {buttonAttrs} from './attrs';
import {buttonTokenName} from './model';

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
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

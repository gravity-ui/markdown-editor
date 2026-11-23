import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {normalizeLinkUrl} from '../url';

import {buttonAttrs} from './attrs';
import {buttonTokenName} from './model';

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    // TODO: markdown-it-directive 2.0.6 reads the label of `:button` without `[` up to a later `]`
    // and breaks `[Press the :button now](/help)`. Waiting for the package update:
    // https://github.com/hilookas/markdown-it-directive/issues/16
    registerInlineDirective(md, 'button', (state, {content, dests, attrs}) => {
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = md.utils.unescapeMd(content?.raw ?? '').trim();
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

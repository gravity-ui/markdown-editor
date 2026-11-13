import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {directiveRawAttr} from '../directive';

import {buttonAttrs} from './attrs';
import {buttonTokenName, normalizeButtonHref} from './model';

export const buttonPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerInlineDirective(md, buttonTokenName, (state, params) => {
        if (!params.content || params.dests) return false;
        const label = md.utils.unescapeMd(params.content.raw).trim();
        // A button without a label consumes its markup and renders nothing.
        if (!label) return true;
        const attrs = params.attrs ?? {};
        // A repeated attribute is a list of values and counts as unsupported.
        const href =
            typeof attrs.href === 'string'
                ? directiveRawAttr(
                      md,
                      state.src.slice(params.content.endPos + 1, params.endPos),
                      'href',
                  )
                : undefined;
        const token = state.push(buttonTokenName, 'a', 0);
        token.content = label;
        token.attrs = Object.entries(buttonAttrs({...attrs, href: normalizeButtonHref(md, href)}));
        return true;
    });
    const {rules} = md.renderer;
    rules[buttonTokenName] = (tokens, idx, _options, _env, self) => {
        const token = tokens[idx];
        return `<a${self.renderAttrs(token)}>${md.utils.escapeHtml(token.content)}</a>`;
    };
};

import {directiveParser, registerInlineDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

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
        const open = state.push(`${buttonTokenName}_open`, 'a', 1);
        open.attrs = Object.entries(
            buttonAttrs({...attrs, href: normalizeButtonHref(md, attrs.href)}),
        );
        const text = state.push('text', '', 0);
        text.content = label;
        state.push(`${buttonTokenName}_close`, 'a', -1);
        return true;
    });
};

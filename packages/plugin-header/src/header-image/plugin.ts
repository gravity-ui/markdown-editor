import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerTokenName} from '../header/model';

import {headerImageAttrs} from './attrs';
import {headerImageTokenName} from './const';

export const headerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, headerImageTokenName, (state, params) => {
        if (params.inlineContent || params.dests) return false;
        // The image is only the first block of a header; elsewhere the line stays text.
        if (state.tokens[state.tokens.length - 1]?.type !== `${headerTokenName}_open`) return false;
        const attrs = params.attrs ?? {};
        const src = typeof attrs.src === 'string' ? md.normalizeLink(attrs.src.trim()) : null;
        const token = state.push(headerImageTokenName, 'img', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = `::${headerImageTokenName}`;
        token.attrs = Object.entries(
            headerImageAttrs({...attrs, src: src !== null && md.validateLink(src) ? src : null}),
        );
        return true;
    });
    const {rules} = md.renderer;
    rules[headerImageTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);
};

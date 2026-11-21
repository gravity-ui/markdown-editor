import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {blockDirectiveLine, directiveRawAttrs} from '../directive';
import {allowedImageUrl} from '../url';

import {bannerImageAttrs} from './attrs';
import {bannerImageTokenName} from './const';

const attrNames = ['src', 'alt', 'title'] as const;

export const bannerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, bannerImageTokenName, (state, params) => {
        if (params.inlineContent || params.dests) return false;
        const values = directiveRawAttrs(
            md,
            blockDirectiveLine(state, params.startLine),
            params.attrs ?? {},
            attrNames,
        );
        const token = state.push(bannerImageTokenName, 'img', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = `::${bannerImageTokenName}`;
        token.attrs = Object.entries(
            bannerImageAttrs({...values, src: allowedImageUrl(md, values.src)}),
        );
        return true;
    });
    const {rules} = md.renderer;
    rules[bannerImageTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);
};

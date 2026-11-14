import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {directiveRawAttr} from '../directive';

import {headerImageAttrs} from './attrs';
import {headerImageTokenName} from './const';

const attrNames = ['src', 'alt', 'title'] as const;

export const headerImagePlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerLeafBlockDirective(md, headerImageTokenName, (state, params) => {
        if (params.inlineContent || params.dests) return false;
        const attrs = params.attrs ?? {};
        const markup = state.src.slice(
            state.bMarks[params.startLine] + state.tShift[params.startLine],
            state.eMarks[params.startLine],
        );
        // The values are taken as written: the directive parser decodes HTML entities.
        // A repeated attribute is a list of values and counts as unsupported.
        const values = Object.fromEntries(
            attrNames.map((name) => [
                name,
                typeof attrs[name] === 'string' ? directiveRawAttr(md, markup, name) : undefined,
            ]),
        );
        const token = state.push(headerImageTokenName, 'img', 0);
        token.block = true;
        token.map = [params.startLine, params.endLine];
        token.markup = `::${headerImageTokenName}`;
        token.attrs = Object.entries(headerImageAttrs(values));
        return true;
    });
    const {rules} = md.renderer;
    // An image without a safe address keeps its token and renders nothing.
    rules[headerImageTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx].attrGet('src') === null ? '' : self.renderToken(tokens, idx, options);
};

import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {headerDomAttrs, normalizeHeaderHeight} from './attrs';
import {HeaderAttr, headerDirectiveName, headerTokenName} from './const';

/** Содержимое между строками `:::` отбрасывается. */
export const headerDirective = (md: MarkdownIt) => {
    md.use(directiveParser());

    registerContainerDirective(md, headerDirectiveName, (state, {attrs, startLine, endLine}) => {
        const token = state.push(headerTokenName, 'div', 0);
        token.block = true;
        token.map = [startLine, endLine];
        token.attrs = Object.entries(
            headerDomAttrs(normalizeHeaderHeight(attrs?.[HeaderAttr.Height])),
        );
        return true;
    });

    md.renderer.rules[headerTokenName] = (tokens, idx, _options, _env, self) =>
        `<div${self.renderAttrs(tokens[idx])}></div>\n`;
};

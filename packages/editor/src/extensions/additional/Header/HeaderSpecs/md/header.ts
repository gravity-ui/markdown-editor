import {directiveParser, registerLeafBlockDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';

import {normalizeHeaderAttrs} from '../attrs';
import {HeaderClassName, headerDirectiveName, headerTokenName} from '../const';
import {headerHtml} from '../dom';

export const headerDirective = (md: MarkdownIt) => {
    md.use(directiveParser());

    registerLeafBlockDirective(md, headerDirectiveName, (state, params) => {
        const attrs = normalizeHeaderAttrs(params.attrs ?? {});

        const token = state.push(headerTokenName, 'div', 0);
        token.map = [params.startLine, params.endLine];
        token.markup = `::${headerDirectiveName}`;
        token.block = true;
        token.content = md.utils.unescapeAll(params.inlineContent?.raw ?? '');
        token.attrSet('class', HeaderClassName.Root);
        for (const [name, value] of Object.entries(attrs)) {
            token.attrSet(`data-${name}`, String(value));
        }

        return true;
    });

    md.renderer.rules[headerTokenName] = (tokens, idx) => {
        const token = tokens[idx];
        const attrs = normalizeHeaderAttrs(
            Object.fromEntries(
                (token.attrs ?? []).map(([name, value]) => [name.replace(/^data-/, ''), value]),
            ),
        );

        return headerHtml(attrs, token.content, md.utils.escapeHtml);
    };
};

import {directiveParser, registerInlineDirective, tokenizeInlineContent} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';

export const footnoteTokenName = 'inline_footnote';

export default function footnote(md: MarkdownIt) {
    md.use(directiveParser());
    registerInlineDirective(md, 'footnote', (state, params) => {
        if (!params.content || params.dests) return false;

        const {content, startPos, endPos} = params;
        const token = state.push(footnoteTokenName, 'span', 0);
        token.meta = {
            content: content.raw,
            prefix: state.src.slice(startPos, content.startPos),
            suffix: state.src.slice(content.endPos, endPos),
            marker: params.attrs?.marker ?? null,
        };
        token.children = [];
        const nested = new state.md.inline.State(state.src, state.md, state.env, token.children);
        nested.level = state.level + 1;
        tokenizeInlineContent(nested, content);
        for (const rule of state.md.inline.ruler2.getRules('')) rule(nested);
        return true;
    });

    md.core.ruler.after('inline', 'inline_footnote_numbering', (state) => {
        let number = 0;
        const visit = (tokens: Token[]) => {
            for (const token of tokens) {
                if (token.type === footnoteTokenName) {
                    token.meta.number = token.meta.marker ?? String(++number);
                } else if (token.children) {
                    visit(token.children);
                }
            }
        };
        visit(state.tokens);
    });

    md.renderer.rules[footnoteTokenName] = (tokens, index, options, env, renderer) => {
        const token = tokens[index];
        const marker = md.utils.escapeHtml(token.meta.number ?? token.meta.marker ?? '1');
        const content = renderer.renderInline(token.children ?? [], options, env);
        return `<span class="g-md-footnote"><sup class="g-md-footnote__marker" tabindex="0">${marker}</sup><span class="g-md-footnote__content">${content}</span></span>`;
    };
}

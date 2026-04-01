import type MarkdownIt from 'markdown-it';

/**
 * markdown-it linkify sets href to linkify-it's normalized URL (e.g. http://ya.ru for "ya.ru").
 * Use the matched raw string when there was no explicit schema so href matches pasted text.
 */
export function linkifyRawHrefPlugin(md: MarkdownIt): MarkdownIt {
    md.core.ruler.after('linkify', 'linkify_raw_href', (state) => {
        for (let j = 0; j < state.tokens.length; j++) {
            const block = state.tokens[j];
            if (block.type !== 'inline' || !block.children) continue;

            const children = block.children;
            for (let i = 0; i < children.length; i++) {
                const open = children[i];
                if (
                    open.type !== 'link_open' ||
                    open.markup !== 'linkify' ||
                    open.info !== 'auto'
                ) {
                    continue;
                }

                const textTok = children[i + 1];
                const close = children[i + 2];
                if (!textTok || textTok.type !== 'text' || !close || close.type !== 'link_close') {
                    continue;
                }

                const chunk = textTok.content;
                const matches = md.linkify.match(chunk);
                if (!matches || matches.length !== 1) continue;

                const m = matches[0];
                if (m.index !== 0 || m.lastIndex !== chunk.length) continue;

                const source = m.schema ? m.url : m.raw;
                const href = md.normalizeLink(source);
                if (md.validateLink(href)) {
                    open.attrSet('href', href);
                }
            }
        }
    });
    return md;
}

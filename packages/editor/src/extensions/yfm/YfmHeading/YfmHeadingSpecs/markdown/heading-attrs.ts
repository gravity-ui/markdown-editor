import {parseMdAttrs} from '@diplodoc/utils';
import type MarkdownIt from 'markdown-it';

export type HeadingAttrsOptions = {
    /** Default – `['id']` */
    allowedAttributes?: string[];
};

const defaultAllowedAttributes = ['id'];

/**
 * MarkdownIt plugin for parsing attributes in headings
 */
export const headingAttrsPlugin: MarkdownIt.PluginWithOptions<HeadingAttrsOptions> = (md, opts) => {
    const allowedAttributes = opts?.allowedAttributes || defaultAllowedAttributes;

    md.core.ruler.push('heading-attrs', (state) => {
        const {tokens} = state;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.type !== 'heading_open') continue;

            const lastTextToken = tokens[i + 1]?.children?.at(-1);
            if (lastTextToken?.type !== 'text') continue;

            const {content} = lastTextToken;
            if (!content.endsWith('}')) continue;

            const idx = content.lastIndexOf('{');
            if (idx === -1) continue;

            const res = parseMdAttrs(md, content, idx, content.length);
            if (!res) continue;

            lastTextToken.content = content.slice(0, idx).trimEnd();

            for (const key of allowedAttributes) {
                if (res.attrs[key]) {
                    if (key === 'class') {
                        const values = res.attrs[key];
                        values.forEach((val) => token.attrJoin(key, val));
                    } else {
                        const value = res.attrs[key][0];
                        token.attrSet(key, value);
                    }
                }
            }
        }
    });
};

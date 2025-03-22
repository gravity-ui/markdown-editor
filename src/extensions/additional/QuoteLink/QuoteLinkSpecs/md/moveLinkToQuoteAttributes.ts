import type {PluginSimple} from 'markdown-it';

export const moveLinkToQuoteAttributes: PluginSimple = (md) => {
    md.core.ruler.push('move-link-to-quote-attributes', (state) => {
        const {tokens} = state;

        let i = 0;

        while (i < tokens.length) {
            const token = tokens[i];
            if (token.type === 'yfm_quote-link_open') {
                const linkToken = tokens[i + 2]?.children?.[0];
                if (linkToken && linkToken.type === 'link_open') {
                    token.attrSet('href', linkToken.attrGet('href') ?? '');
                }

                const linkTextToken = tokens[i + 2]?.children?.[1];
                if (linkTextToken?.content) {
                    token.attrSet('content', linkTextToken.content);
                }

                tokens.splice(i + 1, 3);
            }

            i++;
        }
    });
};

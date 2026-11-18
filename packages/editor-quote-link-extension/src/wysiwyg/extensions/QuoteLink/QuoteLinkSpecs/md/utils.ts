import type Token from 'markdown-it/lib/token';

export function matchLinkAtInlineStart(inlineToken: Token) {
    if (inlineToken.type !== 'inline' || !inlineToken.children?.length) {
        return null;
    }

    const {children: tokens} = inlineToken;
    if (tokens[0].type !== 'link_open') {
        return null;
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === 'link_close') {
            return {
                openToken: tokens[0],
                closeToken: token,
                closeTokenIndex: i,
            };
        }
    }

    return null;
}

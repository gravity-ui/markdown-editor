//
// Utils for working with custom ids in heading tokens.
// Copied from https://github.com/diplodoc-platform/transform/blob/master/src/transform/plugins/anchors/custom-id.ts
// TODO [MAJOR]: import directly from '@diplodoc/transform' after bump it in peerDependencies.
//

import type Token from 'markdown-it/lib/token';

export const CUSTOM_ID_REGEXP = /\[?{ ?#(\S+) ?}]?/g;
export const CUSTOM_ID_EXCEPTION = '[{#T}]';

export const getCustomIds = (content: string) => {
    const ids: string[] = [];

    content.replace(CUSTOM_ID_REGEXP, (match, customId) => {
        if (match !== CUSTOM_ID_EXCEPTION) {
            ids.push(customId);
        }

        return '';
    });

    return ids.length ? ids : null;
};

export const removeCustomId = (content: string) => {
    if (CUSTOM_ID_REGEXP.test(content)) {
        return content
            .replace(CUSTOM_ID_REGEXP, (match) => {
                if (match === CUSTOM_ID_EXCEPTION) {
                    return match;
                }

                return '';
            })
            .trim();
    }

    return content;
};

export const removeCustomIds = (token: Token) => {
    token.content = removeCustomId(token.content);
    token.children?.forEach((child) => {
        child.content = removeCustomId(child.content);
    });
};

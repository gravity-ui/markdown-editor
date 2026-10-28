import type MarkdownIt from 'markdown-it';

import type {LinkMatch} from '../../types/parser';

export function configureLinkify(
    md: MarkdownIt,
    options: {tlds?: string | string[]; defaultProtocol?: 'http' | 'https'} = {},
) {
    if (options.tlds) {
        md.linkify.tlds(options.tlds, true);
    }

    if (options.defaultProtocol === 'https') {
        // The installed linkify-it types use an outdated normalize signature.
        const linkify = md.linkify as unknown as {normalize(match: LinkMatch): void};
        const normalize = linkify.normalize;
        linkify.normalize = function (match) {
            normalize.call(this, match);
            if (!match.schema) {
                Object.assign(match, {
                    url: match.url.replace(/^http:\/\//, 'https://'),
                } satisfies Partial<LinkMatch>);
            }
        };
    }
}

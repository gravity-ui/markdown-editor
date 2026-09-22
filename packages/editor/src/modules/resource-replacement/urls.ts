import {FILE_TOKEN} from '@diplodoc/file-extension';
import MarkdownIt from 'markdown-it';

import type {ResourceDescription} from './types';

/** Built-in semantics depend on the node and its selected attribute, never application kind. */
export function isUrlResource(nodeType: string, description: ResourceDescription) {
    return (
        description.valueType === 'url' ||
        (nodeType === 'image' && description.valueAttribute === 'src') ||
        (nodeType === FILE_TOKEN && description.valueAttribute === 'href')
    );
}

export type ResourceLinkCodec = {
    normalizeLink(url: string): string;
    validateLink(url: string): boolean;
};

// Reuse Markdown's URL rules without retaining a parser or creating a WYSIWYG editor.
const {normalizeLink, validateLink} = new MarkdownIt('zero');
export const defaultResourceUrls: ResourceLinkCodec = {normalizeLink, validateLink};

export function validateResourceUrl(urls: ResourceLinkCodec, value: string) {
    const encoded = urls
        .normalizeLink(value)
        .replace(/[\s<>"'()\\]/g, (char) =>
            encodeURIComponent(char).replace(
                /[!'()]/g,
                (escaped) => `%${escaped.charCodeAt(0).toString(16).toUpperCase()}`,
            ),
        );
    if (!urls.validateLink(value) || !urls.validateLink(encoded))
        throw new Error('Invalid resource URL');
    return encoded;
}

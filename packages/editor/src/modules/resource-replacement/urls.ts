import {FILE_TOKEN} from '@diplodoc/file-extension';

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

export function prepareResourceUrl(urls: ResourceLinkCodec, value: string) {
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

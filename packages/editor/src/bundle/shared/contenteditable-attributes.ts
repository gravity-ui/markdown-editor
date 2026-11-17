import type {ContenteditableAttributes} from '../types';

function isModeContenteditableAttributes(
    attributes: ContenteditableAttributes,
): attributes is Exclude<ContenteditableAttributes, Record<string, string>> {
    return (
        typeof attributes.wysiwyg === 'object' &&
        attributes.wysiwyg !== null &&
        typeof attributes.markup === 'object' &&
        attributes.markup !== null
    );
}

export function resolveContenteditableAttributes(
    attributes: ContenteditableAttributes | undefined,
    mode: 'wysiwyg' | 'markup',
): Record<string, string> | undefined {
    return attributes && isModeContenteditableAttributes(attributes)
        ? attributes[mode]
        : attributes;
}

export const wysiwygForbiddenAttributes = ['contenteditable'] as const;

export const markupForbiddenAttributes = [
    'contenteditable',
    'role',
    'aria-multiline',
    'aria-readonly',
    'aria-autocomplete',
    'aria-haspopup',
    'aria-controls',
    'aria-activedescendant',
] as const;

type FilteredContenteditableAttributes<Forbidden extends string> = Record<string, string> &
    Partial<Record<Forbidden, never>>;

export type WysiwygContenteditableAttributes = FilteredContenteditableAttributes<
    (typeof wysiwygForbiddenAttributes)[number]
>;

export type MarkupContenteditableAttributes = FilteredContenteditableAttributes<
    (typeof markupForbiddenAttributes)[number]
>;

type ModeContenteditableAttributes = {
    wysiwyg: WysiwygContenteditableAttributes;
    markup: MarkupContenteditableAttributes;
};

export type ContenteditableAttributes =
    | WysiwygContenteditableAttributes
    | MarkupContenteditableAttributes
    | ModeContenteditableAttributes;

function isModeContenteditableAttributes(
    attributes: ContenteditableAttributes,
): attributes is ModeContenteditableAttributes {
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

export function filterContenteditableAttributes(
    attributes: Record<string, string> | undefined,
    forbiddenAttributes: readonly string[],
): Record<string, string> {
    const filtered: Record<string, string> = Object.create(null);

    for (const [name, value] of Object.entries(attributes ?? {})) {
        if (!forbiddenAttributes.includes(name)) {
            filtered[name] = value;
        }
    }

    return filtered;
}

export type FilteredContenteditableAttributes<Forbidden extends string> = Record<string, string> &
    Partial<Record<Forbidden, never>>;

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

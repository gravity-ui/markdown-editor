/** Narrows a value to an item of a list of allowed values. */
export const includes = <T>(values: readonly T[], value: unknown): value is T =>
    (values as readonly unknown[]).includes(value);

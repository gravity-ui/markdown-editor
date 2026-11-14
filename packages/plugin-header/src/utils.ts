/** Narrows a value to an item of a list of allowed values. */
export const includes = <T>(values: readonly T[], value: unknown): value is T =>
    (values as readonly unknown[]).includes(value);

/** The values that differ from the defaults, as attribute strings, in the order of the defaults. */
export function nonDefaultValues<T extends object>(
    values: T,
    defaults: Readonly<T>,
): Record<string, string> {
    const result: Record<string, string> = {};
    for (const name of Object.keys(defaults) as (keyof T & string)[]) {
        if (values[name] !== defaults[name]) result[name] = String(values[name]);
    }
    return result;
}

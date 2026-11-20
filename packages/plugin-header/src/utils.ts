export type GetAttr = (name: string) => string | null | undefined;

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

export type GetAttr = (name: string) => string | null | undefined;

export const oneOf = <T extends string | number>(
    values: readonly T[],
    value: unknown,
): T | undefined =>
    typeof value === 'number' || typeof value === 'string'
        ? values.find((item) => String(item) === String(value))
        : undefined;

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

export const toDataAttrs = <T extends object>(
    values: T,
    defaults: Readonly<T>,
): Record<string, string> =>
    Object.fromEntries(
        Object.entries(nonDefaultValues(values, defaults)).map(([name, value]) => [
            `data-${name}`,
            value,
        ]),
    );

export const fromDataAttrs = <T extends object>(getAttr: GetAttr, defaults: Readonly<T>) =>
    Object.fromEntries(
        Object.keys(defaults).map((name) => [name, getAttr(`data-${name}`)]),
    ) as Partial<Record<keyof T, unknown>>;

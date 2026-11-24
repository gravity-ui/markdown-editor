export const includes = <T>(values: readonly T[], value: unknown): value is T =>
    (values as readonly unknown[]).includes(value);

export type AttrGetter = (name: string) => string | null | undefined;

export function valuesOtherThan<T extends object>(
    model: T,
    defaults: Readonly<T>,
): Record<string, string> {
    const values: Record<string, string> = {};
    for (const name of Object.keys(defaults) as (keyof T & string)[]) {
        const value = model[name];
        if (value !== null && value !== defaults[name]) values[name] = String(value);
    }
    return values;
}

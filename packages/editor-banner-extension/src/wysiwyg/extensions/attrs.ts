/** The pairs of `candidate` whose value differs from the value of the same name in `previous`. */
export function changedAttrs<T extends object>(
    previous: Readonly<Record<string, unknown>>,
    candidate: T,
): [keyof T & string, T[keyof T]][] {
    return (Object.entries(candidate) as [keyof T & string, T[keyof T]][]).filter(
        ([name, value]) => previous[name] !== value,
    );
}

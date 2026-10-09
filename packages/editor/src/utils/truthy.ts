type Falsy = false | 0 | 0n | '' | null | undefined;

export function isTruthy<T>(value: T): value is Exclude<T, Falsy> {
    return Boolean(value);
}

export function isFalsy<T>(value: T): value is Extract<T, Falsy> {
    return !value;
}

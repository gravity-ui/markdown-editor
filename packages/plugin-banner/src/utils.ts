export const includes = <T>(values: readonly T[], value: unknown): value is T =>
    (values as readonly unknown[]).includes(value);

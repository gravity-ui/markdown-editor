/** The depth limit for following references between declarations. */
export const MAX_DEPTH = 10;

/** Checks that a TypeScript flag set contains a flag. */
export function hasFlag(flags, flag) {
    // eslint-disable-next-line no-bitwise
    return (flags & flag) !== 0;
}

/** Compares strings by code points, independent of the system locale. */
export function compareStrings(a, b) {
    if (a === b) return 0;

    return a < b ? -1 : 1;
}

/** Sorts strings and removes duplicates. */
export function sortedUnique(values) {
    return [...new Set(values)].sort(compareStrings);
}

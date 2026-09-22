import type {ChangeSpec} from '@codemirror/state';

/** Replace the changed span while preserving the common prefix and suffix. */
export function textChanges(before: string, after: string): ChangeSpec[] {
    if (before === after) return [];

    let from = 0;
    let oldEnd = before.length;
    let newEnd = after.length;
    while (from < oldEnd && from < newEnd && before[from] === after[from]) from++;
    // Keep surrogate pairs together when the two strings share only their high surrogate.
    if (from > 0 && /[\uD800-\uDBFF]/.test(before[from - 1])) from--;

    while (oldEnd > from && newEnd > from && before[oldEnd - 1] === after[newEnd - 1]) {
        oldEnd--;
        newEnd--;
    }
    if (oldEnd < before.length && /[\uDC00-\uDFFF]/.test(before[oldEnd])) {
        oldEnd++;
        newEnd++;
    }
    return [{from, to: oldEnd, insert: after.slice(from, newEnd)}];
}

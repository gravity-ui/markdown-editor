import {type ChangeSpec, Transaction} from '@codemirror/state';

import {
    type MarkdownResource,
    type ResourceMarkdownOptions,
    collectMarkdownResources,
} from '../../../modules/resource-replacement/markdown';
import {isHistoryTransaction} from '../history-lock';

import {resolved} from './effects';

export {isHistoryTransaction};

export function isOriginalLocalDocumentChange(tr: Transaction) {
    return (
        tr.docChanged &&
        !tr.annotation(resolved) &&
        !tr.annotation(Transaction.remote) &&
        !isHistoryTransaction(tr)
    );
}

export function collectInsertedMarkupResources(
    tr: Transaction,
    options: Pick<ResourceMarkdownOptions, 'parser' | 'resources'>,
) {
    const entries: MarkdownResource[] = [];
    tr.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
        if (inserted.length)
            entries.push(...collectMarkdownResources(inserted.toString(), options));
    }, true);
    return entries;
}

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

export function getTransactionTrigger(tr: Transaction) {
    if (tr.isUserEvent('input.drop') || tr.isUserEvent('move.drop')) return 'drop';
    if (tr.isUserEvent('input.paste')) return 'paste';
    return undefined;
}

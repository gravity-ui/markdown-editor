import type {EditorState, Transaction} from 'prosemirror-state';

import {mapResourceRanges} from './map-resource-ranges';
import {
    type ResourceReplacementMeta,
    remoteTransactionMeta,
    resolvedResourceMeta,
    resourceHistoryKey,
} from './meta';
import type {ResourceBatch, ResourceReplacementState} from './types';

export function isHistoryTransaction(tr: Transaction) {
    return Boolean(resourceHistoryKey && tr.getMeta(resourceHistoryKey));
}

export function isRemoteTransaction(tr: Transaction) {
    return Boolean(tr.getMeta(remoteTransactionMeta) || tr.getMeta('rebased'));
}

export function isLocalHistoryTransaction(tr: Transaction) {
    return isHistoryTransaction(tr) && !isRemoteTransaction(tr);
}

/** Ignore derived changes, collaboration updates and history replay. */
export function isOriginalLocalDocumentChange(tr: Transaction) {
    return (
        tr.docChanged &&
        !tr.getMeta('appendedTransaction') &&
        !tr.getMeta(resolvedResourceMeta) &&
        !isRemoteTransaction(tr) &&
        !isHistoryTransaction(tr)
    );
}

export function isSelectionInCode(state: EditorState) {
    return (
        state.selection.$from.parent.type.spec.code ||
        (state.storedMarks ?? state.selection.$from.marks()).some((mark) => mark.type.spec.code)
    );
}

export function mapBatchRanges(batches: ResourceReplacementState, tr: Transaction) {
    return batches.map((batch) =>
        batch.started
            ? batch
            : {
                  ...batch,
                  ranges: mapResourceRanges(batch.ranges, tr),
              },
    );
}

export function applyBatchMeta(
    batches: ResourceBatch[],
    meta?: ResourceReplacementMeta,
): ResourceBatch[] {
    if (meta?.type === 'release') return batches.filter((batch) => batch.id !== meta.id);
    if (meta?.type === 'start')
        return batches.map((batch) =>
            batch.id === meta.id ? {id: batch.id, started: true} : batch,
        );
    return batches;
}

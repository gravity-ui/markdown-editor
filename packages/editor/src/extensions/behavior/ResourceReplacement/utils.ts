import type {EditorState, Transaction} from 'prosemirror-state';
import type {Mapping} from 'prosemirror-transform';

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

/** Ignore derived changes, collaboration updates and history replay. */
export function isOriginalLocalDocumentChange(tr: Transaction) {
    return (
        tr.docChanged &&
        !tr.getMeta('appendedTransaction') &&
        !tr.getMeta(resolvedResourceMeta) &&
        !tr.getMeta(remoteTransactionMeta) &&
        !tr.getMeta('rebased') &&
        !isHistoryTransaction(tr)
    );
}

export function isSelectionInCode(state: EditorState) {
    return (
        state.selection.$from.parent.type.spec.code ||
        (state.storedMarks ?? state.selection.$from.marks()).some((mark) => mark.type.spec.code)
    );
}

export function mapBatchRanges(batches: ResourceReplacementState, mapping: Mapping) {
    return batches.map((batch) => ({
        ...batch,
        ranges: batch.ranges
            .map((range) => ({
                from: mapping.map(range.from, 1),
                to: mapping.map(range.to, -1),
            }))
            .filter((range) => range.from < range.to),
    }));
}

export function applyBatchMeta(batches: ResourceBatch[], meta?: ResourceReplacementMeta) {
    if (meta?.type === 'release') return batches.filter((batch) => batch.id !== meta.id);
    if (meta?.type === 'start')
        return batches.map((batch) => (batch.id === meta.id ? {...batch, started: true} : batch));
    return batches;
}

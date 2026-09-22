import type {EditorState, Transaction} from 'prosemirror-state';

import {remoteTransactionMeta, resolvedResourceMeta, resourceHistoryKey} from './const';

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

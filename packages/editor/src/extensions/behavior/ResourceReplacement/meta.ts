import {history} from 'prosemirror-history';
import type {Transaction} from 'prosemirror-state';

import {resourceReplacementKey} from './plugin-key';

export type ResourceReplacementMeta = {type: 'start' | 'release'; id: string};

export const resolvedResourceMeta = 'markdown-editor-resolved-resource';
/** Collaboration integrations can mark remote transactions with this metadata. */
export const remoteTransactionMeta = 'markdown-editor-remote-transaction';
export const resourceHistoryKey = history().spec.key;

export function getResourceReplacementMeta(tr: Transaction): ResourceReplacementMeta | undefined {
    return tr.getMeta(resourceReplacementKey);
}

/** All transaction filters must accept this operation-lifecycle cleanup. */
export function isResourceReplacementCleanupTransaction(tr: Transaction): boolean {
    return (
        getResourceReplacementMeta(tr)?.type === 'release' &&
        !tr.docChanged &&
        !tr.selectionSet &&
        !tr.storedMarksSet &&
        !tr.scrolledIntoView &&
        tr.getMeta('addToHistory') === false &&
        !(resourceHistoryKey && tr.getMeta(resourceHistoryKey))
    );
}

export function setResourceReplacementMeta(
    tr: Transaction,
    meta: ResourceReplacementMeta,
): Transaction {
    return tr.setMeta(resourceReplacementKey, meta);
}

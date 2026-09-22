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

export function setResourceReplacementMeta(
    tr: Transaction,
    meta: ResourceReplacementMeta,
): Transaction {
    return tr.setMeta(resourceReplacementKey, meta);
}

import {history} from 'prosemirror-history';
import {PluginKey} from 'prosemirror-state';

import type {ResourceReplacementState} from './types';

export const resourceReplacementKey = new PluginKey<ResourceReplacementState>(
    'resourceReplacement',
);
export const resolvedResourceMeta = 'markdown-editor-resolved-resource';
/** Collaboration integrations can mark remote transactions with this metadata. */
export const remoteTransactionMeta = 'markdown-editor-remote-transaction';

export const resourceHistoryKey = history().spec.key;

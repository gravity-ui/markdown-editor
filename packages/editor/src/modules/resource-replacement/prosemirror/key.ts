import {PluginKey} from 'prosemirror-state';

import type {ResourceTarget} from '../tracking';
import type {ResourceReplacementSource} from '../types';

export type ResourceRange = {from: number; to: number};
export type ResourceReplacementState = {
    ranges: readonly ResourceRange[];
    targets: readonly ResourceTarget[];
    source?: ResourceReplacementSource;
};

export type ResourceReplacementMeta =
    | {type: 'insert'; targets: readonly ResourceTarget[]}
    | {type: 'complete'}
    | {type: 'collect'};

export const resourceReplacementKey = new PluginKey<ResourceReplacementState>(
    'resourceReplacement',
);

export const resolvedResourceMeta = 'markdown-editor-resolved-resource';
/** Collaboration integrations can mark remote transactions with this metadata. */
export const remoteTransactionMeta = 'markdown-editor-remote-transaction';

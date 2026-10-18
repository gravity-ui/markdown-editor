import type {EditorState, Transaction} from 'prosemirror-state';

import type {ResourceReplacementController} from '../../../modules/resource-replacement/controller';

export type ResourceRange = {from: number; to: number};

export type ResourceBatch = {id: string} & (
    | {started: false; ranges: ResourceRange[]}
    | {started: true}
);
export type ResourceReplacementState = readonly ResourceBatch[];

/**
 * Every filterTransaction must accept isResourceReplacementCleanupTransaction(tr).
 * Custom dispatch must apply cleanup synchronously; normalizers must leave it unchanged.
 */
export type ResourceReplacementOptions = {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    /** Select document changes to track. Must be pure: it can run during state precomputation. */
    shouldProcessTransaction: (transaction: Transaction, state: EditorState) => boolean;
};

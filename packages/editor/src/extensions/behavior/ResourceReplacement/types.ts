import type {EditorState, Transaction} from 'prosemirror-state';

import type {ResourceReplacementController} from '../../../modules/resource-replacement/controller';
import type {ResourceRange} from '../../../modules/resource-replacement/controller.utils';

export type ResourceBatch = {id: string; ranges: ResourceRange[]; started: boolean};
export type ResourceReplacementState = readonly ResourceBatch[];

export type ResourceReplacementOptions = {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    /** Select document changes to track. Must be pure: it can run during state precomputation. */
    shouldTrack: (transaction: Transaction, state: EditorState) => boolean;
};

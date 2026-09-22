import type {EditorState, Transaction} from 'prosemirror-state';

import type {ResourceReplacementController} from '../controller';
import type {ResourceRange} from '../controller.utils';

export type ResourceBatch = {id: string; ranges: ResourceRange[]; started: boolean};
export type ResourceReplacementState = readonly ResourceBatch[];
export type ResourceReplacementMeta = {type: 'start' | 'release'; id: string};

export type ResourceReplacementOptions = {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    /** Select document changes to track. Must be pure: it can run during state precomputation. */
    shouldTrack: (transaction: Transaction, state: EditorState) => boolean;
};

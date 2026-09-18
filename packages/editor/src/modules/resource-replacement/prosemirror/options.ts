import type {EditorState, Transaction} from 'prosemirror-state';

import type {ResourceReplacementHost} from '../host';
import type {ResourceReplacementSource} from '../types';

export type ResourceReplacementOptions = {
    host: ResourceReplacementHost;
    /** Select document changes to track. Must be pure: it can run during state precomputation. */
    shouldTrack: (transaction: Transaction, state: EditorState) => boolean;
    /** Snapshot source metadata from the selected transaction. Must be pure. */
    getSource?: (transaction: Transaction) => ResourceReplacementSource | undefined;
};

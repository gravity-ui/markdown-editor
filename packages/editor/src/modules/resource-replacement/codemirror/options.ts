import type {Transaction} from '@codemirror/state';

import type {Parser} from '../../../core/types/parser';
import type {ResourceReplacementHost} from '../host';
import type {ResourceReplacementSource} from '../types';

export type CodeMirrorResourceReplacementOptions = {
    host: ResourceReplacementHost;
    parser: () => Parser;
    /** Pure predicate selecting local document changes. */
    shouldTrack: (transaction: Transaction) => boolean;
    /** Snapshot source metadata while preparing the selected transaction. Must be pure. */
    getSource?: (transaction: Transaction) => ResourceReplacementSource | undefined;
};

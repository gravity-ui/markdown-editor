import type {Transaction} from '@codemirror/state';
import type {Schema} from 'prosemirror-model';

import type {ResourceReplacementHost} from '../host';
import type {ResourceReplacementSource} from '../types';

import type {ResourceLinkCodec} from './handlers';

export type CodeMirrorResourceReplacementOptions = {
    host: ResourceReplacementHost;
    schema: () => Schema;
    urls: () => ResourceLinkCodec;
    /** Pure predicate selecting local document changes. */
    shouldTrack: (transaction: Transaction) => boolean;
    /** Snapshot source metadata while preparing the selected transaction. Must be pure. */
    getSource?: (transaction: Transaction) => ResourceReplacementSource | undefined;
};

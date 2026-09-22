import type {Transaction} from '@codemirror/state';

import type {ResourceReplacementController} from '../controller';
import type {ResourceSpecOverrides} from '../types';
import type {ResourceLinkCodec} from '../urls';

export type CodeMirrorResourceReplacementOptions = {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    resources: ResourceSpecOverrides;
    /** URL rules from the configured Markdown parser. Supplied automatically by useMarkdownEditor. */
    urls: ResourceLinkCodec;
    /** Pure predicate selecting local document changes. */
    shouldTrack: (transaction: Transaction) => boolean;
};

import type {Transaction} from '@codemirror/state';

import type {ResourceReplacementController} from '../controller';
import type {ResourceSpecOverrides} from '../types';
import type {ResourceLinkCodec} from '../urls';

export type CodeMirrorResourceReplacementOptions = {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    resources: ResourceSpecOverrides;
    /** Defaults to Markdown's standard URL rules, independently of WYSIWYG extensions. */
    urls?: ResourceLinkCodec;
    /** Pure predicate selecting local document changes. */
    shouldTrack: (transaction: Transaction) => boolean;
};

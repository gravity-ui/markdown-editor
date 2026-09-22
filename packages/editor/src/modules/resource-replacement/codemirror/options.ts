import type {Transaction} from '@codemirror/state';

import type {ResourceReplacementController} from '../controller';
import type {ResourceMarkdownOptions} from '../markdown';

export type CodeMirrorResourceReplacementOptions = ResourceMarkdownOptions & {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    /** Pure predicate selecting local document changes. */
    shouldTrack: (transaction: Transaction) => boolean;
};

import type {Transaction} from '@codemirror/state';

import {
    type MarkdownResource,
    type ResourceMarkdownOptions,
    collectMarkdownResources,
} from '../markdown';

export function collectInsertedMarkupResources(
    tr: Transaction,
    options: Pick<ResourceMarkdownOptions, 'parser' | 'resources'>,
) {
    const entries: MarkdownResource[] = [];
    tr.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
        if (inserted.length)
            entries.push(...collectMarkdownResources(inserted.toString(), options));
    }, true);
    return entries;
}

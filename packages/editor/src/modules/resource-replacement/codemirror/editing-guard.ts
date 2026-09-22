import type {Transaction} from '@codemirror/state';

import {overlaps} from '../controller.utils';

import type {ResourceBatch} from './types';

export function changesProtectedResources(tr: Transaction, batches: readonly ResourceBatch[]) {
    let blocked = false;
    tr.changes.iterChangedRanges((from, to) => {
        if (batches.some((batch) => batch.ranges.some((range) => overlaps(range, from, to))))
            blocked = true;
    });
    return blocked;
}

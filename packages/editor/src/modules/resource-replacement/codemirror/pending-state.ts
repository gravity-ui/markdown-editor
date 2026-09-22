import {StateField, type Transaction} from '@codemirror/state';

import {historyLocked} from '../../../markup/codemirror/history-lock';

import {release, resolved, tracked} from './const';
import type {ResourceBatch} from './types';

/** Обычные правки снаружи не входят в диапазон; замена должна остаться внутри него. */
export function mapBatchRanges(batches: readonly ResourceBatch[], tr: Transaction) {
    const replacement = tr.annotation(resolved);
    return batches.map((batch) => ({
        ...batch,
        ranges: batch.ranges.map((range) => ({
            ...range,
            from: tr.changes.mapPos(range.from, replacement ? -1 : 1),
            to: tr.changes.mapPos(range.to, replacement ? 1 : -1),
        })),
    }));
}

export const pendingField = StateField.define<ResourceBatch[]>({
    create: () => [],
    provide: (field) => historyLocked.from(field, (batches) => batches.length > 0),
    update(batches, tr) {
        const trackedBatch = tr.annotation(tracked);
        if (
            !trackedBatch &&
            (!batches.length ||
                (!tr.docChanged && !tr.effects.some((effect) => effect.is(release))))
        )
            return batches;
        const remaining = batches.filter(
            (batch) =>
                !tr.effects.some((effect) => effect.is(release) && effect.value === batch.id),
        );
        const mapped = mapBatchRanges(remaining, tr);
        if (trackedBatch) mapped.push(trackedBatch);
        return mapped;
    },
});

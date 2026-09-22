import type {Mapping} from 'prosemirror-transform';

import type {ResourceBatch, ResourceReplacementMeta, ResourceReplacementState} from './types';

export function mapBatchRanges(batches: ResourceReplacementState, mapping: Mapping) {
    return batches.map((batch) => ({
        ...batch,
        ranges: batch.ranges
            .map((range) => ({
                from: mapping.map(range.from, 1),
                to: mapping.map(range.to, -1),
            }))
            .filter((range) => range.from < range.to),
    }));
}

export function applyBatchMeta(batches: ResourceBatch[], meta?: ResourceReplacementMeta) {
    if (meta?.type === 'release') return batches.filter((batch) => batch.id !== meta.id);
    if (meta?.type === 'start')
        return batches.map((batch) => (batch.id === meta.id ? {...batch, started: true} : batch));
    return batches;
}

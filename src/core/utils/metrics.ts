import type {Transaction} from 'prosemirror-state';

import {logger} from '../../logger';

const METRICS_KEY = 'metrics';

export const trackTransactionMetrics = (
    tr: Transaction,
    type: string,
    meta?: Record<string, any>,
) => {
    tr.setMeta(METRICS_KEY, {type, meta});

    return tr;
};

export const logTransactionMetrics = (tr: Transaction) => {
    const metrics = tr.getMeta(METRICS_KEY);
    if (metrics) {
        logger.metrics({
            component: 'transaction',
            event: metrics.type,
            duration: Date.now() - tr.time,
            meta: metrics.meta,
        });
    }
};

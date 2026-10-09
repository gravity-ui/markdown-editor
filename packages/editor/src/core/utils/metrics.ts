import type {Transaction} from 'prosemirror-state';

import {type Logger2, globalLogger} from '../../logger';

const METRICS_KEY = 'metrics';

export const trackTransactionMetrics = (
    tr: Transaction,
    type: string,
    meta?: Record<string, any>,
) => {
    tr.setMeta(METRICS_KEY, {type, meta});

    return tr;
};

export const logTransactionMetrics = (tr: Transaction, logger: Logger2.ILogger) => {
    const metrics = tr.getMeta(METRICS_KEY);
    if (metrics) {
        globalLogger.metrics({
            component: 'transaction',
            event: metrics.type,
            duration: Date.now() - tr.time,
            meta: metrics.meta,
        });
        logger.metrics({
            component: 'transaction',
            event: metrics.type,
            duration: Date.now() - tr.time,
            meta: metrics.meta,
        });
    }
};

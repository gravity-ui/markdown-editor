import {useMemo} from 'react';

import type {Logger2} from '@gravity-ui/markdown-editor';

export function useLogs(logger: Logger2.LogReceiver) {
    useMemo(() => {
        // eslint-disable-next-line no-console
        logger.on('log', (data) => console.log('Log:', data.msg, data));
        logger.on('warn', (data) => console.warn('Warn:', data.msg, data));
        logger.on('error', (data) => console.error('Error:', data.error, data));
        logger.on('event', (data) => console.info('Event:', data.event, data));
        logger.on('action', (data) => console.info('Action:', data.action, data));
        logger.on('metrics', (data) => console.info('Metrics:', data.component, data));
    }, [logger]);
}

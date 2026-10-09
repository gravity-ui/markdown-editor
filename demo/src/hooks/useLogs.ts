import {useEffect} from 'react';

import type {Logger2} from '@gravity-ui/markdown-editor';

export function useLogs(logger: Logger2.LogReceiver) {
    useEffect(() => {
        const unsubscribe = [
            // eslint-disable-next-line no-console
            subscribe(logger, 'log', (data) => console.log('Log:', data.msg, data)),
            subscribe(logger, 'warn', (data) => console.warn('Warn:', data.msg, data)),
            subscribe(logger, 'error', (data) => console.error('Error:', data.error, data)),
            subscribe(logger, 'event', (data) => console.info('Event:', data.event, data)),
            subscribe(logger, 'action', (data) => console.info('Action:', data.action, data)),
            subscribe(logger, 'metrics', (data) => console.info('Metrics:', data.component, data)),
        ];
        return () => unsubscribe.forEach((off) => off());
    }, [logger]);
}

function subscribe<K extends keyof Logger2.ReceiverDataMap>(
    logger: Logger2.LogReceiver,
    type: K,
    listener: (data: Logger2.ReceiverDataMap[K]) => void,
) {
    logger.on(type, listener);
    return () => logger.off(type, listener);
}

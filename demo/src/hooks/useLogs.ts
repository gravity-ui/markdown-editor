import {useEffect, useMemo} from 'react';

import type {Logger2} from '@gravity-ui/markdown-editor';

type Listeners = {
    [K in keyof Logger2.ReceiverDataMap]: (data: Logger2.ReceiverDataMap[K]) => void;
};

const listeners: Listeners = {
    // eslint-disable-next-line no-console
    log: (data) => console.log('Log:', data.msg, data),
    warn: (data) => console.warn('Warn:', data.msg, data),
    error: (data) => console.error('Error:', data.error, data),
    event: (data) => console.info('Event:', data.event, data),
    action: (data) => console.info('Action:', data.action, data),
    metrics: (data) => console.info('Metrics:', data.component, data),
};

const types = Object.keys(listeners) as (keyof Listeners)[];

export function useLogs(logger: Logger2.LogReceiver) {
    // Child views emit render metrics from mount effects, which run before this hook's effect.
    // Subscription is idempotent, so StrictMode and discarded renders keep one listener per type.
    useMemo(() => subscribe(logger), [logger]);
    useEffect(() => subscribe(logger), [logger]);
}

function subscribe(logger: Logger2.LogReceiver) {
    types.forEach((type) => {
        off(logger, type);
        on(logger, type);
    });
    return () => types.forEach((type) => off(logger, type));
}

function on<K extends keyof Listeners>(logger: Logger2.LogReceiver, type: K) {
    logger.on(type, listeners[type]);
}

function off<K extends keyof Listeners>(logger: Logger2.LogReceiver, type: K) {
    logger.off(type, listeners[type]);
}

import {v4 as uuidv4} from 'uuid';

import {type Receiver, SafeEventEmitter} from './utils';

const noop = () => {};

declare global {
    /** @deprecated */
    namespace MdEditorLogger {
        type MetricsData = {
            component: string;
            event: string;
            duration?: number;
            meta?: Record<string, any>;
        };

        interface ActionData {
            action: string;
            source: string;
            [key: string]: any;
        }

        interface Logger {
            log(...data: any[]): void;
            info(...data: any[]): void;
            error(...data: any[]): void;
            warn(...data: any[]): void;
            metrics(data: MetricsData): void;
            action(data: ActionData): void;
        }

        interface Settings extends Partial<Logger> {}
    }
}

/** @deprecated */
class Logger implements MdEditorLogger.Logger {
    #logger: MdEditorLogger.Logger = this.createLogger({});

    get log() {
        return this.#logger.log;
    }

    get info() {
        return this.#logger.info;
    }

    get error() {
        return this.#logger.error;
    }

    get warn() {
        return this.#logger.warn;
    }

    get metrics() {
        return this.#logger.metrics;
    }

    get action() {
        return this.#logger.action;
    }

    setLogger(settings: MdEditorLogger.Settings = {}) {
        this.#logger = this.createLogger(settings);
    }

    /**
     * @inner
     *
     * To override the default logger, use setLogger
     */
    createLogger(settings: MdEditorLogger.Settings): MdEditorLogger.Logger {
        return {
            log: settings.log ?? noop,
            info: settings.info ?? noop,
            warn: settings.warn ?? noop,
            error: settings.error ?? noop,
            metrics: settings.metrics ?? noop,
            action: settings.action ?? noop,
        };
    }
}

/** @deprecated */
// export const logger = new Logger();

type Logger2Args = {
    log: any;
    warn: any;
    error: any;
    action: MdEditorLogger.ActionData;
    metrics: MdEditorLogger.MetricsData;
};

export interface Logger2 extends Receiver<Logger2Args> {
    readonly instanceId: string;

    log(data: Logger2Args['log']): void;
    warn(data: Logger2Args['warn']): void;
    error(data: Logger2Args['error']): void;
    action(data: Logger2Args['action']): void;
    metrics(data: Logger2Args['metrics']): void;
}

export class Logger2Impl extends SafeEventEmitter<Logger2Args> implements Logger2 {
    readonly instanceId: string;

    constructor({instanceId}: {instanceId?: string} = {}) {
        super();
        this.instanceId = instanceId ?? uuidv4();
    }

    log(data: Logger2Args['log']): void {
        this.emit('log', data);
    }

    warn(data: Logger2Args['warn']): void {
        this.emit('warn', data);
    }

    error(data: Logger2Args['error']): void {
        this.emit('error', data);
    }

    action(data: Logger2Args['action']): void {
        this.emit('action', data);
    }

    metrics(data: Logger2Args['metrics']): void {
        this.emit('metrics', data);
    }
}

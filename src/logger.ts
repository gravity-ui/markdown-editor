import {type Receiver, SafeEventEmitter} from './utils';

type MsgObj = {
    msg: string;
    [key: string]: unknown;
};

type ErrObj = {
    error: any;
    [key: string]: unknown;
};

type Logger2Args = {
    log: MsgObj;
    warn: MsgObj;
    error: ErrObj;
    action: MdEditorLogger.ActionData;
    metrics: MdEditorLogger.MetricsData;
};

export interface LogReceiver extends Receiver<Logger2Args> {}
export interface LogEmitter {
    log(data: Logger2Args['log']): void;
    warn(data: Logger2Args['warn']): void;
    error(data: Logger2Args['error']): void;
    action(data: Logger2Args['action']): void;
    metrics(data: Logger2Args['metrics']): void;
}
export interface Logger2 extends LogEmitter, LogReceiver {
    nested(params: object): Logger2;
}

export class Logger2Impl extends SafeEventEmitter<Logger2Args> implements Logger2 {
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

    nested(params: object): Logger2 {
        return {
            log: (data) => this.log({...params, ...data}),
            warn: (data) => this.warn({...params, ...data}),
            error: (data) => this.error({...params, ...data}),
            action: (data) => this.action({...params, ...data}),
            metrics: (data) => this.metrics({...params, ...data}),
            nested: (prms) => this.nested({...params, ...prms}),
            on: this.on.bind(this),
            off: this.off.bind(this),
        };
    }
}

// =====> next is deprecated

const noop = () => {};

// Major: remove old logger implementation

declare global {
    /** @deprecated */
    namespace MdEditorLogger {
        /** @deprecated */
        type MetricsData = {
            component: string;
            event: string;
            duration?: number;
            meta?: Record<string, any>;
        };

        /** @deprecated */
        interface ActionData {
            action: string;
            source: string;
            [key: string]: any;
        }

        /** @deprecated */
        interface Logger {
            log(...data: any[]): void;
            info(...data: any[]): void;
            error(...data: any[]): void;
            warn(...data: any[]): void;
            metrics(data: MetricsData): void;
            action(data: ActionData): void;
        }

        /** @deprecated */
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
export const logger = new Logger();
/**
 * Alias for global singleton logger instance
 *
 * @deprecated
 */
export const globalLogger = logger;

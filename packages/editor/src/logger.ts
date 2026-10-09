import {type Listener, type Receiver, SafeEventEmitter} from './utils/event-emitter';

type MsgObj = {
    msg: string;
    [key: string]: unknown;
};

type ErrObj = {
    error: any;
    [key: string]: unknown;
};

type EventObj = {
    event: string;
    [key: string]: unknown;
};

// MAJOR: rename Logger2 to Logger (namespace and class)

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Logger2 {
    export type LogData = MsgObj;
    export type WarnData = MsgObj;
    export type ErrorData = ErrObj;
    export type ActionData = MdEditorLogger.ActionData;
    export type MetricsData = MdEditorLogger.MetricsData;
    export type EventData = EventObj;

    export type ReceiverDataMap = {
        log: LogData;
        warn: WarnData;
        error: ErrorData;
        event: EventData;
        action: ActionData;
        metrics: MetricsData;
    };

    export interface LogReceiver extends Receiver<ReceiverDataMap> {}

    export interface LogEmitter {
        /** Log a regular message */
        log(msg: string, ...data: object[]): void;
        /** Log a warning message */
        warn(msg: string, ...data: object[]): void;
        /** Log an error */
        error(err: string | Error | unknown, ...data: object[]): void;
        /** Log an event triggered in editor. For example, changing mode, pasting, or otherwise */
        event(data: Logger2.EventData): void;
        /** Log the action called in editor and its source (from toolbar, or hotkeys, etc.) */
        action(data: Logger2.ActionData): void;
        /** Log metric data, such as parsing or execution time */
        metrics(data: Logger2.MetricsData): void;
    }

    export interface ILogger extends Logger2.LogEmitter, Logger2.LogReceiver {
        /** Create nested logger with bound parameters */
        nested(params: object): ILogger;
    }
}

export class Logger2 implements Logger2.ILogger {
    readonly #emitter = new SafeEventEmitter<Logger2.ReceiverDataMap>();

    log(msg: string, ...data: object[]): void {
        const obj: object = Object.assign({}, ...data);
        const logData = Object.assign(obj, {msg});
        this.#emitter.emit('log', logData);
    }

    warn(msg: string, ...data: object[]): void {
        const obj: object = Object.assign({}, ...data);
        const warnData = Object.assign(obj, {msg});
        this.#emitter.emit('warn', warnData);
    }

    error(err: string | Error | unknown, ...data: object[]): void {
        const error = typeof err === 'string' ? Error(err) : err;
        const obj: object = Object.assign({}, ...data);
        const errorData = Object.assign(obj, {error});
        this.#emitter.emit('error', errorData);
    }

    action(data: Logger2.ActionData): void {
        this.#emitter.emit('action', data);
    }

    metrics(data: Logger2.MetricsData): void {
        this.#emitter.emit('metrics', data);
    }

    event(data: Logger2.EventData): void {
        this.#emitter.emit('event', data);
    }

    nested(params: object): Logger2.ILogger {
        const self = this;
        const paramsKey = Symbol();

        const logger: Logger2.ILogger & {[paramsKey]: object} = {
            [paramsKey]: params,
            log(msg, ...data) {
                if (self.#emitter.countOf('log')) self.log(msg, this[paramsKey], ...data);
            },
            warn(msg, ...data) {
                if (self.#emitter.countOf('warn')) self.warn(msg, this[paramsKey], ...data);
            },
            error(err, ...data) {
                if (self.#emitter.countOf('error')) self.error(err, this[paramsKey], ...data);
            },
            action(data) {
                if (self.#emitter.countOf('action')) self.action({...this[paramsKey], ...data});
            },
            metrics(data) {
                if (self.#emitter.countOf('metrics')) self.metrics({...this[paramsKey], ...data});
            },
            event(data) {
                if (self.#emitter.countOf('event')) self.event({...this[paramsKey], ...data});
            },
            nested(nestedParams) {
                return {
                    ...this,
                    [paramsKey]: {
                        ...this[paramsKey],
                        ...nestedParams,
                    },
                };
            },
            on: self.on.bind(self),
            off: self.off.bind(self),
        };

        return logger;
    }

    on<K extends keyof Logger2.ReceiverDataMap>(
        type: K,
        listener: Listener<Logger2.ReceiverDataMap[K]>,
    ): void {
        this.#emitter.on(type, listener);
    }

    off<K extends keyof Logger2.ReceiverDataMap>(
        type: K,
        listener: Listener<Logger2.ReceiverDataMap[K]>,
    ): void {
        this.#emitter.off(type, listener);
    }
}

// MAJOR: remove old logger implementation

const noop = () => {};

declare global {
    /** @deprecated */
    namespace MdEditorLogger {
        /** @deprecated */
        type MetricsData = {
            component: string;
            event: string;
            duration?: number;
            meta?: Record<string, any>;
            [key: string]: any;
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
 * @deprecated
 */
export const globalLogger = logger;

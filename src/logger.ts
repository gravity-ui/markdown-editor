import {type Receiver, SafeEventEmitter} from './utils';

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

    export type EmitterDataMap = {
        log: LogData;
        warn: WarnData;
        error: ErrorData;
        event: EventData;
        action: ActionData;
        metrics: MetricsData;
    };

    export interface LogReceiver extends Receiver<ReceiverDataMap> {}

    export interface LogEmitter {
        log(data: EmitterDataMap['log']): void;
        warn(data: EmitterDataMap['warn']): void;
        error(data: EmitterDataMap['error']): void;
        action(data: EmitterDataMap['action']): void;
        metrics(data: EmitterDataMap['metrics']): void;
        event(data: EmitterDataMap['event']): void;
    }
}

export interface Logger2 extends Logger2.LogEmitter, Logger2.LogReceiver {
    nested(params: object): Logger2;
}

export class Logger2Impl extends SafeEventEmitter<Logger2.ReceiverDataMap> implements Logger2 {
    log(data: Logger2.LogData): void {
        this.emit('log', data);
    }

    warn(data: Logger2.WarnData): void {
        this.emit('warn', data);
    }

    error(data: Logger2.ErrorData): void {
        this.emit('error', data);
    }

    action(data: Logger2.ActionData): void {
        this.emit('action', data);
    }

    metrics(data: Logger2.MetricsData): void {
        this.emit('metrics', data);
    }

    event(data: Logger2.EventData): void {
        this.emit('event', data);
    }

    nested(params: object): Logger2 {
        const self = this;
        const paramsKey = Symbol();

        const logger: Logger2 & {[paramsKey]: object} = {
            [paramsKey]: params,
            log(data) {
                self.log({...this[paramsKey], ...data});
            },
            warn(data) {
                self.warn({...this[paramsKey], ...data});
            },
            error(data) {
                self.error({...this[paramsKey], ...data});
            },
            action(data) {
                self.action({...this[paramsKey], ...data});
            },
            metrics(data) {
                self.metrics({...this[paramsKey], ...data});
            },
            event(data) {
                self.event({...this[paramsKey], ...data});
            },
            nested(nestedParams) {
                return {...this, [paramsKey]: {...this[paramsKey], ...nestedParams}};
            },
            on: self.on.bind(self),
            off: self.off.bind(self),
        };

        return logger;
    }
}

// Major: remove old logger implementation

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

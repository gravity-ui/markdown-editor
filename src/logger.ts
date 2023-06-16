const noop = () => {};

declare global {
    namespace YfmEditorLogger {
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

class Logger implements YfmEditorLogger.Logger {
    #logger: YfmEditorLogger.Logger = this.createLogger({});

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

    setLogger(settings: YfmEditorLogger.Settings = {}) {
        this.#logger = this.createLogger(settings);
    }

    /**
     * @inner
     *
     * To override the default logger, use setLogger
     */
    createLogger(settings: YfmEditorLogger.Settings): YfmEditorLogger.Logger {
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

export const logger = new Logger();

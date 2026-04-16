/* eslint-disable no-console */

/**
 * Logging utility for doc-generation scripts
 */
export class Logger {
    info(...args) {
        console.log(...args);
    }

    warn(...args) {
        console.warn('Warning:', ...args);
    }

    error(...args) {
        console.error('Error:', ...args);
    }

    success(...args) {
        console.log('✓', ...args);
    }
}

/** Shared logger instance. */
export const logger = new Logger();

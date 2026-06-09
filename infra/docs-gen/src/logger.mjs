/* eslint-disable no-console */

export class Logger {
    /**
     * Writes an informational message.
     */
    info(...args) {
        console.log(...args);
    }

    /**
     * Writes a warning message.
     */
    warn(...args) {
        console.warn('Warning:', ...args);
    }

    /**
     * Writes an error message.
     */
    error(...args) {
        console.error('Error:', ...args);
    }

    /**
     * Writes a successful completion message.
     */
    success(...args) {
        console.log('Done:', ...args);
    }
}

export const logger = new Logger();

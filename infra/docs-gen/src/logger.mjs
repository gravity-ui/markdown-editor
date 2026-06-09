/* eslint-disable no-console */

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
        console.log('Done:', ...args);
    }
}

export const logger = new Logger();

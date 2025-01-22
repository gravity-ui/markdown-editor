import {EventEmitter} from 'events';

import type {Parser} from '../types/parser';

export interface IMarkupManager {
    setMarkup(rawMarkdown: string): void;
    setPos(tokenId: string, pos: [number, number]): void;
    setParser(parser: Parser): void;
    reset(): void;
    on(event: string, listener: (...args: any[]) => void): void;
}

export interface Logger {
    log(message: string): void;
    error(message: string): void;
}

/**
 * Validate if a value is a valid position array
 */
function isPosArray(pos: unknown): pos is [number, number] {
    return Array.isArray(pos) && pos.length === 2 && pos.every((v) => typeof v === 'number');
}

export class MarkupManager extends EventEmitter implements IMarkupManager {
    private _rawMarkdown = '';
    private _poses: Map<string, [number, number]> = new Map();
    private _parser: Parser | null = null;
    private readonly logger: Logger;

    constructor(logger?: Logger) {
        super();
        this.logger = logger ?? console;
    }

    /**
     * Set raw markdown text and emit an event
     */
    setMarkup(rawMarkdown: string): void {
        if (typeof rawMarkdown !== 'string') {
            this.logger.error('[MarkupManager] rawMarkdown must be a string');
            return;
        }
        this._rawMarkdown = rawMarkdown;

        this.emit('markupManager.markupChanged', {data: rawMarkdown});
        this.logger.log('[MarkupManager] Raw markdown set successfully');
    }
    /**
     * Get the stored raw markdown text
     */
    get rawMarkdown(): string {
        return this._rawMarkdown;
    }

    /**
     * Set the position of a token
     */
    setPos(tokenId: string, pos: [number, number]): void {
        if (!isPosArray(pos)) {
            this.logger.error(
                '[MarkupManager] Invalid position format. Must be [start, end] with numbers',
            );
            return;
        }
        this._poses.set(tokenId, pos);

        this.logger.log(`[MarkupManager] Position for token ${tokenId} set to ${pos}`);
    }

    /**
     * Get the positions map
     */
    get poses(): Map<string, [number, number]> {
        return this._poses;
    }

    /**
     * Set the parser instance
     */
    setParser(parser: Parser): void {
        this._parser = parser;

        this.logger.log('[MarkupManager] Parser instance set successfully');
    }

    /**
     * Get the parser instance
     */
    get parser(): Parser {
        if (!this._parser) {
            const error = new Error('[MarkupManager] Markdown Parser is not set');
            this.logger.error(`[MarkupManager] ${error.message}`);
            this.emit('markupManager.error', {error});
            throw error;
        }

        return this._parser;
    }

    /**
     * Reset the stored raw markdown, positions, and parser, and emit an event
     */
    reset(): void {
        this._rawMarkdown = '';
        this._poses.clear();
        this._parser = null;

        this.emit('markupManager.markupChanged', {data: null});
        this.logger.log('[MarkupManager] MarkupManager has been reset');
    }
}

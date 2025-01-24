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

export interface MarkupManagerOptions {
    trackedTokensTypes?: string[];
    trackedNodesTypes?: string[];
    allowDynamicAttributesForTrackedEntities?: boolean;
}

export class MarkupManager extends EventEmitter implements IMarkupManager {
    private _rawMarkdown = '';
    private _poses: Map<string, [number, number]> = new Map();
    private _parser: Parser | null = null;
    private _trackedTokensTypes: Set<string> = new Set();
    private _trackedNodesTypes: Set<string> = new Set();
    private _allowDynamicAttributesForTrackedEntities = false;

    private readonly logger: Logger;

    constructor(options: MarkupManagerOptions = {}, logger?: Logger) {
        super();
        this._trackedTokensTypes = new Set(options.trackedTokensTypes ?? []);
        this._trackedNodesTypes = new Set(options.trackedNodesTypes ?? []);
        this._allowDynamicAttributesForTrackedEntities =
            options.allowDynamicAttributesForTrackedEntities ?? true;
        this.logger = logger ?? console;
    }

    /**
     * Set the list of tokens types to track
     */
    setTrackedTokensTypes(tokensTypes: string[]): void {
        this._trackedTokensTypes = new Set(tokensTypes);
        this.logger.log(`[MarkupManager] Tracked tokens types set to: ${tokensTypes.join(', ')}`);
    }

    /**
     * Set the list of tokens types to track
     */
    setTrackedNodesTypes(nodesTypes: string[]): void {
        this._trackedNodesTypes = new Set(nodesTypes);
        this.logger.log(`[MarkupManager] Tracked nodes types set to: ${nodesTypes.join(', ')}`);
    }

    /**
     * Check if a token type is being tracked
     */
    isTrackedTokenType(tokenType: string): boolean {
        return this._trackedTokensTypes.has(tokenType);
    }

    /**
     * Check if a token type is being tracked
     */
    isTrackedNodeType(nodeType: string): boolean {
        return this._trackedNodesTypes.has(nodeType);
    }

    /**
     * Check if a token type is being tracked
     */
    isAllowDynamicAttributesForTrackedEntities(): boolean {
        return this._allowDynamicAttributesForTrackedEntities;
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
     * Get raw markdown for a specific token by its unique ID
     */
    getMarkupByTokenId(tokenId: string): string | null {
        const pos = this._poses.get(tokenId);

        if (!pos) {
            this.logger.error(`[MarkupManager] No position found for ID: ${tokenId}`);
            return null;
        }

        const [start, end] = pos;

        return this._rawMarkdown.slice(start, end);
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
    setPos(id: string, pos: [number, number] | null): void {
        if (!isPosArray(pos)) {
            this.logger.error(
                '[MarkupManager] Invalid position format. Must be [start, end] with numbers',
            );
            return;
        }
        this._poses.set(id, pos);

        this.logger.log(`[MarkupManager] Position for ID ${id} set to ${pos}`);
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

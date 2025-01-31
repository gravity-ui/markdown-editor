import {EventEmitter} from 'events';

import {Node} from 'prosemirror-model';
import {v4} from 'uuid';

export interface IMarkupManager {
    setMarkup(id: string, rawMarkup: string): void;
    setNode(id: string, node: Node): void;
    getMarkup(id: string): string | null;
    getNode(id: string): Node | null;
    reset(): void;
    on(event: string, listener: (...args: any[]) => void): void;
}

export interface Logger {
    log(message: string): void;
    error(message: string): void;
}

export class MarkupManager extends EventEmitter implements IMarkupManager {
    private _markups: Map<string, string> = new Map();
    private _nodes: Map<string, Node> = new Map();
    private _namespace = '';

    private readonly logger: Logger;

    constructor(logger?: Logger) {
        super();
        this.logger = logger ?? console;
        this._namespace = v4();
    }

    /**
     * Set raw markup for a specific id
     */
    setMarkup(id: string, rawMarkup: string): void {
        if (typeof rawMarkup !== 'string') {
            this.logger.error('[MarkupManager] rawMarkup must be a string');
            return;
        }
        this._markups.set(id, rawMarkup);

        this.emit('markupManager.markupChanged', {id, rawMarkup});
        this.logger.log(`[MarkupManager] Raw markup for ID ${id} set successfully`);
    }

    /**
     * Set a node for a specific id
     */
    setNode(id: string, node: Node): void {
        if (!node) {
            this.logger.error('[MarkupManager] Node must be a valid ProseMirror Node');
            return;
        }
        this._nodes.set(id, node);

        this.emit('markupManager.nodeChanged', {id, node});
        this.logger.log(`[MarkupManager] Node for ID ${id} set successfully`);
    }

    /**
     * Get raw markup for a specific id
     */
    getMarkup(id: string): string | null {
        return this._markups.get(id) ?? null;
    }

    /**
     * Get a node for a specific id
     */
    getNode(id: string): Node | null {
        return this._nodes.get(id) ?? null;
    }

    getNamespace() {
        return this._namespace;
    }

    /**
     * Reset the stored markups and nodes
     */
    reset(): void {
        this._markups.clear();
        this._nodes.clear();

        this.emit('markupManager.reset');
        this.logger.log('[MarkupManager] MarkupManager has been reset');
    }
}

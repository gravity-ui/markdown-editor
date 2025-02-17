import type {Node} from 'prosemirror-model';
import {v4} from 'uuid';

import type {Logger2} from '../logger';
import {SafeEventEmitter} from '../utils';

export interface IMarkupManager {
    setMarkup(id: string, rawMarkup: string): void;
    setNode(id: string, node: Node): void;
    getMarkup(id: string): string | null;
    getNode(id: string): Node | null;
    reset(): void;
    on<K extends keyof Events>(event: K, listener: (value: Events[K]) => void): void;
}

interface Events {
    markupChanged: {id: string; rawMarkup: string};
    nodeChanged: {id: string; node: Node};
    reset: {};
}

export class MarkupManager extends SafeEventEmitter<Events> implements IMarkupManager {
    private _markups: Map<string, string> = new Map();
    private _nodes: Map<string, Node> = new Map();
    private _namespace: string;

    private readonly logger: Logger2;

    constructor(logger: Logger2) {
        super();
        this.logger = logger;
        this._namespace = v4();
    }

    /**
     * Set raw markup for a specific id
     */
    setMarkup(id: string, rawMarkup: string): void {
        if (typeof rawMarkup !== 'string') {
            this.logger.warn({msg: '[MarkupManager] rawMarkup must be a string'});
            return;
        }
        this._markups.set(id, rawMarkup);

        this.emit('markupChanged', {id, rawMarkup});
        this.logger.log({msg: `[MarkupManager] Raw markup for ID ${id} set successfully`});
    }

    /**
     * Set a node for a specific id
     */
    setNode(id: string, node: Node): void {
        if (!node) {
            this.logger.warn({msg: '[MarkupManager] Node must be a valid ProseMirror Node'});
            return;
        }
        this._nodes.set(id, node);

        this.emit('nodeChanged', {id, node});
        this.logger.log({msg: `[MarkupManager] Node for ID ${id} set successfully`});
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

    getNamespace(): string {
        return this._namespace;
    }

    /**
     * Reset the stored markups and nodes
     */
    reset(): void {
        this._markups.clear();
        this._nodes.clear();

        this.emit('reset', {});
        this.logger.log({msg: '[MarkupManager] MarkupManager has been reset'});
    }
}

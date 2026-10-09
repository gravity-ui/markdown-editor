import type {EditorState, Transaction} from '#pm/state';
import {uniqueId} from 'src/lodash';

import {pluginKey} from './plugin';
import type {TrMeta} from './types';

export type SharedStateKeySpec = {
    name?: string;
};

export class SharedStateKey<T extends object> {
    /**
     * Define a new key.
     * If you create two keys with the same name, they will refer to the same value from the state.
     * If name not passed, a unique one will be generated.
     */
    static define<T extends object>(spec: SharedStateKeySpec = {}) {
        const key = spec.name ?? uniqueId('shared_state_key');
        return new this<T>(key);
    }

    #key: string;

    /** Add metadata to transaction to change data in state */
    readonly appendTransaction = Object.freeze({
        /** Set or replace data stored by current key */
        set: (tr: Transaction, data: T): Transaction => {
            return this.appendTrMeta(tr, {type: 'set', data});
        },
        /** Update (patch) data stored by current key */
        update: (tr: Transaction, data: Partial<T>): Transaction => {
            return this.appendTrMeta(tr, {type: 'update', data});
        },
        /** Delete data stored by current key */
        delete: (tr: Transaction): Transaction => {
            return this.appendTrMeta(tr, {type: 'delete'});
        },
    });

    private constructor(key: string) {
        this.#key = key;
    }

    getNotifier(state: EditorState) {
        const self = this;
        const notifyBus = pluginKey.getState(state)?.notifyBus;
        return {
            subscribe(fn: (data: T | undefined) => void) {
                notifyBus?.on(self.#key, fn as (arg: unknown) => void);
                return () => {
                    this.unsubscribe(fn);
                };
            },
            unsubscribe(fn: (data: T | undefined) => void) {
                notifyBus?.off(self.#key, fn as (arg: unknown) => void);
            },
        };
    }

    getValue(state: EditorState): T | undefined {
        return pluginKey.getState(state)?.map.get(this.#key) as T | undefined;
    }

    private appendTrMeta(tr: Transaction, action: Action<T>) {
        const meta: TrMeta = tr.getMeta(pluginKey) || {actions: []};
        meta.actions.push({...action, key: this.#key});
        return tr.setMeta(pluginKey, meta);
    }
}

/** @internal */
type Action<T extends object> =
    | {
          type: 'set';
          data: T;
      }
    | {
          type: 'update';
          data: Partial<T>;
      }
    | {
          type: 'delete';
      };

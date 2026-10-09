import {PluginKey, type PluginSpec} from '#pm/state';
import {EventEmitter} from 'src/utils/event-emitter';

import type {SharedPluginState, TrMeta} from './types';

/** @internal */
export const pluginKey = new PluginKey<SharedPluginState>('shared-state');

export const pluginSpec: PluginSpec<SharedPluginState> = {
    key: pluginKey,
    state: {
        init() {
            return {
                map: new Map(),
                changedKeys: null,
                notifyBus: new EventEmitter(),
            };
        },
        apply(tr, {map, notifyBus}) {
            const meta = tr.getMeta(pluginKey) as TrMeta | undefined;
            if (!meta || !meta.actions.length) return {changedKeys: null, map, notifyBus};

            const changedKeys = new Set<string>();
            for (const action of meta.actions) {
                switch (action.type) {
                    case 'delete': {
                        map.delete(action.key);
                        break;
                    }
                    case 'update': {
                        let value = map.get(action.key);
                        value = {...value, ...action.data};
                        map.set(action.key, value);
                        break;
                    }
                    case 'set': {
                        map.set(action.key, action.data);
                        break;
                    }
                    default: {
                        continue;
                    }
                }
                changedKeys.add(action.key);
            }

            return {changedKeys, map, notifyBus};
        },
    },
    view: () => {
        return {
            update(view) {
                const state = pluginKey.getState(view.state);
                if (!state || !state.changedKeys || !state.changedKeys.size) return;

                for (const key of state.changedKeys) {
                    const value = state.map.get(key);
                    state.notifyBus.emit(key, value);
                }
            },
        };
    },
};

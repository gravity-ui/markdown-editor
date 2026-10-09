import type {Extension} from '#core';
import {Plugin} from '#pm/state';

import {pluginSpec} from './plugin';

export {SharedStateKey, type SharedStateKeySpec} from './utils';

/**
 * This extension enables a plugin that stores internal state and handles its changes via meta-information in transactions.
 * You can get, change and subscribe to state changes using a SharedStateKey instance.
 */
export const SharedState: Extension = (builder) => {
    builder.addPlugin(() => new Plugin(pluginSpec));
};

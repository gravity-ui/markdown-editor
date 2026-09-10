import {Plugin, PluginKey} from 'prosemirror-state';

import type {ActionStorage} from '../../core';
import type {ContextConfig} from '../../extensions/behavior/SelectionContext/types';
import type {ToolbarItemData} from '../../toolbar';

export interface ContextualToolbarsConfig {
    selection?: ContextConfig;
    slash?: ToolbarItemData<ActionStorage>[];
}

/** Toolbar overrides supplied by the editor view. Extension options remain the fallback. */
export const contextualToolbarsKey = new PluginKey<ContextualToolbarsConfig>('contextual-toolbars');

export function contextualToolbarsPlugin() {
    return new Plugin<ContextualToolbarsConfig>({
        key: contextualToolbarsKey,
        state: {
            init: () => ({}),
            apply: (tr, config) => tr.getMeta(contextualToolbarsKey) ?? config,
        },
    });
}

import type {ActionStorage, ExtensionAuto} from '#core';
import {Plugin, PluginKey} from '#pm/state';
import type {ToolbarItemData} from 'src/toolbar';

import type {ContextConfig} from '../SelectionContext/types';

export interface ContextualToolbarsConfig {
    selection?: ContextConfig;
    slash?: ToolbarItemData<ActionStorage>[];
}

/** Toolbar overrides supplied by the editor view. Extension options remain the fallback. */
export const contextualToolbarsKey = new PluginKey<ContextualToolbarsConfig>('contextual-toolbars');

export const ContextualToolbars: ExtensionAuto = (builder) => {
    builder.addPlugin(
        () =>
            new Plugin<ContextualToolbarsConfig>({
                key: contextualToolbarsKey,
                state: {
                    init: () => ({}),
                    apply: (tr, config) => tr.getMeta(contextualToolbarsKey) ?? config,
                },
            }),
    );
};

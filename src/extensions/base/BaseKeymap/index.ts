import {baseKeymap, joinDown, joinUp, lift, selectParentNode} from 'prosemirror-commands';
import {undoInputRule} from 'prosemirror-inputrules';

import type {ExtensionAuto} from '../../../core';

/**
 * Add this extension after all other extensions with keymaps
 */
export const BaseKeymap: ExtensionAuto = (builder) => {
    builder
        .addKeymap(
            () => ({
                Backspace: undoInputRule,
                'Alt-ArrowUp': joinUp,
                'Alt-ArrowDown': joinDown,
                'Mod-BracketLeft': lift,
                'Alt-Shift-Escape': selectParentNode,
            }),
            builder.PluginPriority.Lowest,
        )
        .addKeymap(() => baseKeymap, builder.PluginPriority.Lowest);
};

import {baseKeymap, lift, selectParentNode} from 'prosemirror-commands';
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
                'Mod-BracketLeft': lift,
                'Alt-Shift-Escape': selectParentNode,
            }),
            builder.Priority.Lowest,
        )
        .addKeymap(() => baseKeymap, builder.Priority.Lowest);
};

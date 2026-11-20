import {type Extension, Prec} from '@codemirror/state';
import {type Command, type EditorView, type KeyBinding, ViewPlugin, keymap} from '@codemirror/view';

import {Action, formatter} from '../../shortcuts';
import type {TabFocusModeState} from '../../utils/tab-focus-mode';

export function createMarkupTabFocusMode(state: TabFocusModeState): {
    extension: Extension;
    initialize(view: EditorView): void;
} {
    const plugin = ViewPlugin.define((view) => {
        let destroyed = false;
        const syncMode = () => view.setTabFocusMode(state.getMode() === 'focus');
        return {
            get active() {
                return !destroyed;
            },
            syncMode,
            destroy() {
                destroyed = true;
                state.off('change', syncMode);
            },
        };
    });
    const toggle: Command = (view) => {
        if (!view.plugin(plugin)?.active) return false;
        state.toggle();
        return true;
    };
    const bindings: KeyBinding[] = [];
    const shortcut = formatter.toCM(Action.ToggleTabFocusMode);
    if (shortcut) {
        bindings.push({key: shortcut, run: toggle, stopPropagation: true});
    }

    return {
        extension: [plugin, Prec.highest(keymap.of(bindings))],
        initialize(view) {
            const value = view.plugin(plugin);
            if (value?.active) {
                state.off('change', value.syncMode);
                state.on('change', value.syncMode);
                value.syncMode();
            }
        },
    };
}

import {type Extension, Prec} from '@codemirror/state';
import {type Command, type KeyBinding, ViewPlugin, keymap} from '@codemirror/view';

import {Action, formatter} from '../../shortcuts';
import {createTabFocusModeKeydownHandler} from '../../shortcuts/tab-focus-mode';
import type {TabFocusModeState} from '../../utils/tab-focus-mode';

export function createMarkupTabFocusModeExtension(state: TabFocusModeState): Extension {
    const onKeyDown = createTabFocusModeKeydownHandler(state);
    const plugin = ViewPlugin.define((view) => {
        let destroyed = false;
        const syncMode = () => view.setTabFocusMode(state.getMode() === 'focus');
        view.dom.addEventListener('keydown', onKeyDown, true);
        queueMicrotask(() => {
            if (!destroyed) syncMode();
        });
        state.on('change', syncMode);
        return {
            get active() {
                return !destroyed;
            },
            destroy() {
                destroyed = true;
                view.dom.removeEventListener('keydown', onKeyDown, true);
                state.off('change', syncMode);
            },
        };
    });
    const toggle: Command = (view) => {
        if (!view.plugin(plugin)?.active) return false;
        state.toggle();
        return true;
    };
    const bindings: KeyBinding[] = [{mac: 'Shift-Alt-m', run: toggle, stopPropagation: true}];
    const shortcut = formatter.toCM(Action.ToggleTabFocusMode);
    if (shortcut) {
        bindings.push({key: shortcut, run: toggle, stopPropagation: true});
    }

    return [plugin, Prec.highest(keymap.of(bindings))];
}

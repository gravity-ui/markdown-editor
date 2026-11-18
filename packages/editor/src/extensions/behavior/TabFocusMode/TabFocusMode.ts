import {type Command, Plugin} from 'prosemirror-state';

import type {Action, Extension, Keymap} from '../../../core';
import {Action as ShortcutAction, formatter} from '../../../shortcuts';
import {createTabFocusModeKeydownHandler} from '../../../shortcuts/tab-focus-mode';
import {withLogAction} from '../../../utils/keymap';
import type {TabFocusModeState} from '../../../utils/tab-focus-mode';

const action = 'toggleTabFocusMode';

export function createWysiwygTabFocusModeExtension(state: TabFocusModeState): Extension {
    const handleTab = createTabFocusModeKeydownHandler(state);
    const toggle: Command = (_editorState, dispatch) => {
        if (dispatch) state.toggle();
        return true;
    };

    return (builder) => {
        builder.addAction(action, () => ({
            isActive: () => state.getMode() === 'focus',
            isEnable: toggle,
            run: toggle,
        }));
        builder.addKeymap(() => {
            const shortcut = formatter.toPM(ShortcutAction.ToggleTabFocusMode);
            const bindings: Keymap = {};
            if (shortcut) {
                bindings[shortcut] = withLogAction(action, toggle);
            }
            return bindings;
        }, builder.Priority.Highest);
        builder.addPlugin(
            () =>
                new Plugin({
                    view(view) {
                        view.dom.addEventListener('keydown', handleTab, true);
                        return {
                            destroy() {
                                view.dom.removeEventListener('keydown', handleTab, true);
                            },
                        };
                    },
                }),
            builder.Priority.Highest,
        );
    };
}

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [action]: Action;
        }
    }
}

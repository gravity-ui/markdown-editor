import {type Command, Plugin} from 'prosemirror-state';

import type {Action, Extension, Keymap} from '../../../core';
import {Action as ShortcutAction, formatter} from '../../../shortcuts';
import {withLogAction} from '../../../utils/keymap';
import type {TabFocusModeState} from '../../../utils/tab-focus-mode';

const action = 'toggleTabFocusMode';

export function createWysiwygTabFocusModeExtension(state: TabFocusModeState): Extension {
    const toggle: Command = () => {
        state.toggle();
        return true;
    };

    return (builder) => {
        builder.addAction(action, () => ({
            isActive: () => state.getMode() === 'focus',
            isEnable: () => true,
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
                    props: {
                        handleDOMEvents: {
                            keydown(_view, event) {
                                return state.getMode() === 'focus' && event.key === 'Tab';
                            },
                        },
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

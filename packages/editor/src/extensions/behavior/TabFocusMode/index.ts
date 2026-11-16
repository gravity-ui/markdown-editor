import {type Extension as CodeMirrorExtension, Prec} from '@codemirror/state';
import {ViewPlugin, keymap} from '@codemirror/view';
import {Plugin} from 'prosemirror-state';

import type {Extension} from '../../../core';
import {Action, createShortcutHandler} from '../../../shortcuts';

export type TabFocusMode = 'focus' | 'indent';

export type TabFocusModeOptions = {
    /** Behavior when the editor is created. Defaults to 'indent'. */
    defaultMode?: TabFocusMode;
};

export type TabFocusModeExtension = {
    wysiwyg: Extension;
    markup: CodeMirrorExtension;
    getMode(): TabFocusMode;
    setMode(mode: TabFocusMode): void;
    toggle(): void;
    subscribe(listener: () => void): () => void;
};

/** Share the selected Tab behavior between WYSIWYG and Markdown. */
export function createTabFocusModeExtension({
    defaultMode = 'indent',
}: TabFocusModeOptions = {}): TabFocusModeExtension {
    let mode = defaultMode;
    const listeners = new Set<() => void>();

    const getMode = () => mode;
    const setMode = (nextMode: TabFocusMode) => {
        if (mode === nextMode) return;
        mode = nextMode;
        listeners.forEach((listener) => listener());
    };
    const toggle = () => setMode(mode === 'focus' ? 'indent' : 'focus');
    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };
    const toggleFromShortcut = createShortcutHandler(Action.ToggleTabFocusMode, toggle);
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.isComposing) return;

        if (toggleFromShortcut(event)) {
            event.preventDefault();
            event.stopPropagation();
        } else if (
            mode === 'focus' &&
            event.key === 'Tab' &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
        ) {
            // Skip editor and widget handlers, preserving the real browser Tab action.
            event.stopPropagation();
        }
    };

    const wysiwyg: Extension = (builder) => {
        builder.addPlugin(
            () =>
                new Plugin({
                    view(view) {
                        view.dom.addEventListener('keydown', onKeyDown, true);
                        return {
                            destroy() {
                                view.dom.removeEventListener('keydown', onKeyDown, true);
                            },
                        };
                    },
                }),
            builder.Priority.Highest,
        );
    };

    const toggleFromMarkup = () => {
        toggle();
        return true;
    };
    const markup: CodeMirrorExtension = [
        ViewPlugin.define((view) => {
            let destroyed = false;
            const syncMode = () => view.setTabFocusMode(mode === 'focus');
            view.dom.addEventListener('keydown', onKeyDown, true);
            // CodeMirror creates plugins before its input handlers are initialized.
            queueMicrotask(() => {
                if (!destroyed) syncMode();
            });
            const unsubscribe = subscribe(syncMode);
            return {
                destroy() {
                    destroyed = true;
                    view.dom.removeEventListener('keydown', onKeyDown, true);
                    unsubscribe();
                },
            };
        }),
        Prec.highest(
            keymap.of([
                // Keep CodeMirror's existing macOS shortcut in sync with the shared state.
                {mac: 'Shift-Alt-m', run: toggleFromMarkup},
            ]),
        ),
    ];

    return {wysiwyg, markup, getMode, setMode, toggle, subscribe};
}

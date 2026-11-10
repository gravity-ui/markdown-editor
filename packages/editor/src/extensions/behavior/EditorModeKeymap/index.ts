import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto, Keymap} from '../../../core';
import {Action as A, formatter as f} from '../../../shortcuts';
import {VERSION} from '../../../version';

export type EditorModeKeymapOptions = {
    /** Submit handler. Return true to stop propagation. */
    onSubmit?(): boolean;
    /** Cancel handler. Return true to stop propagation. */
    onCancel?(): boolean;
    /** @default false */
    enableTabExitOnEscape?: boolean;
    ignoreKeysList?: string[];
};

/**
 * Use this extension if you need to handle form actions like cancel and/or submit.
 */
export const EditorModeKeymap: ExtensionAuto<EditorModeKeymapOptions> = (builder, opts) => {
    let allowTabExit = false;
    const resetTabExit = () => {
        allowTabExit = false;
        return false;
    };

    if (opts.enableTabExitOnEscape)
        builder.addPlugin(
            () =>
                new Plugin({
                    props: {
                        handleDOMEvents: {
                            keydown(view, event) {
                                if (!allowTabExit || event.target !== view.dom) return false;

                                if (event.key === 'Tab') {
                                    return true;
                                }

                                if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
                                    return false;
                                }

                                return resetTabExit();
                            },
                            blur: resetTabExit,
                            mousedown: resetTabExit,
                            beforeinput: resetTabExit,
                            paste: resetTabExit,
                            cut: resetTabExit,
                            drop: resetTabExit,
                            compositionstart: resetTabExit,
                            pointerdown: resetTabExit,
                            input: resetTabExit,
                        },
                    },
                }),
            // Reset before Clipboard's Highest-priority paste handler consumes the event.
            builder.Priority.Highest + 1,
        );

    builder.addKeymap(() => {
        const bindings: Keymap = {};
        const {onCancel, onSubmit} = opts;
        const logger = builder.logger.nested({
            source: 'keymap',
        });

        if (onCancel)
            bindings[f.toPM(A.Cancel)!] = (_state, _dispatch, view) => {
                const result = onCancel();
                allowTabExit =
                    Boolean(opts.enableTabExitOnEscape) && result && Boolean(view?.hasFocus());
                logger.event({event: 'cancel', result});
                return result;
            };
        if (onSubmit)
            bindings[f.toPM(A.Submit)!] = () => {
                const result = onSubmit();
                logger.event({event: 'submit', result});
                return result;
            };

        bindings[f.toPM(A.__debug)!] = () => {
            debug();
            return true;
        };

        return bindings;
    });

    if (opts.ignoreKeysList?.length) {
        const ignore = () => true;
        const bindings: Keymap = {};
        for (const key of opts.ignoreKeysList) {
            bindings[key] = ignore;
        }
        builder.addKeymap(() => bindings, builder.Priority.Lowest);
    }
};

function debug() {
    const message = ['YFM-Editor Debug info', `Version: ${VERSION}`].join('\n');
    console.info(message);
}

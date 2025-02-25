import type {ExtensionAuto, Keymap} from '../../../core';
import {Action as A, formatter as f} from '../../../shortcuts';
import {VERSION} from '../../../version';

export type EditorModeKeymapOptions = {
    /** Submit handler. Return true to stop propagation. */
    onSubmit?(): boolean;
    /** Cancel handler. Return true to stop propagation. */
    onCancel?(): boolean;
    ignoreKeysList?: string[];
};

/**
 * Use this extension if you need to handle form actions like cancel and/or submit.
 */
export const EditorModeKeymap: ExtensionAuto<EditorModeKeymapOptions> = (builder, opts) => {
    builder.addKeymap(() => {
        const bindings: Keymap = {};
        const {onCancel, onSubmit} = opts;
        const logger = builder.logger.nested({
            source: 'keymap',
        });

        if (onCancel)
            bindings[f.toPM(A.Cancel)!] = () => {
                const result = onCancel();
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

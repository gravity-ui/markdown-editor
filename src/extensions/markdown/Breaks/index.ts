import type {NodeType} from 'prosemirror-model';
import {chainCommands, exitCode} from 'prosemirror-commands';
import {logger} from '../../../logger';
import type {ExtensionAuto, Keymap} from '../../../core';
import {isMac} from '../../../utils/platform';
import {BreaksSpecs, BreaksSpecsOptions, hbType, sbType} from './BreaksSpecs';

export {BreaksSpecs, BreakNodeName, hbType, sbType} from './BreaksSpecs';

export type BreaksOptions = {
    /**
     * This option is used if the 'breaks' parameter is not specified via the context
     * @default 'hard'
     */
    // TODO: [context] make this deprecated
    preferredBreak?: 'hard' | 'soft';
};

export const Breaks: ExtensionAuto<BreaksOptions> = (builder, opts) => {
    let preferredBreak: 'hard' | 'soft';
    if (builder.context.has('breaks')) {
        preferredBreak = builder.context.get('breaks') ? 'soft' : 'hard';
    } else {
        preferredBreak = opts.preferredBreak ?? 'hard';
        logger.info(
            "[Breaks extension]: Parameter 'breaks' is not defined in context; value from options is used",
        );
    }

    builder.use<BreaksSpecsOptions>(BreaksSpecs, {preferredBreak});

    builder.addKeymap(({schema}) => {
        const cmd = addBr((preferredBreak === 'soft' ? sbType : hbType)(schema));
        const keys: Keymap = {
            'Shift-Enter': cmd,
        };

        if (isMac()) {
            keys['Ctrl-Enter'] = cmd;
        }

        return keys;
    });
};

const addBr = (br: NodeType) =>
    chainCommands(exitCode, (state, dispatch) => {
        dispatch?.(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
        return true;
    });

declare global {
    namespace YfmEditor {
        interface Context {
            /**
             * Same as @type {MarkdownIt.Options.breaks}
             */
            breaks: boolean;
        }
    }
}

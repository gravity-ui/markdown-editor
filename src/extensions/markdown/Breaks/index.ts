import type {NodeType} from 'prosemirror-model';
import {chainCommands, exitCode} from 'prosemirror-commands';
import {logger} from '../../../logger';
import type {ExtensionAuto, Keymap} from '../../../core';
import {isMac} from '../../../utils/platform';
import {nodeTypeFactory} from '../../../utils/schema';

const hardBreak = 'hard_break';
const softBreak = 'soft_break';
export const hbType = nodeTypeFactory(hardBreak);
export const sbType = nodeTypeFactory(softBreak);

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

    builder.addNode(hardBreak, () => ({
        spec: {
            inline: true,
            group: 'inline',
            selectable: false,
            parseDOM: [{tag: 'br'}],
            toDOM() {
                return ['br'];
            },
        },
        fromYfm: {tokenName: 'hardbreak', tokenSpec: {name: hardBreak, type: 'node'}},
        toYfm: (state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++) {
                if (parent.child(i).type !== node.type) {
                    state.write('\\\n');
                    return;
                }
            }
        },
    }));

    // TODO: should we handle softbreak differently at different md.options.breaks setting?

    // we can safely convert softbreak into hardbreak,
    // but in this case non-edited markup will always be changed – a backspash will be added
    builder.addNode(softBreak, () => ({
        spec: {
            inline: true,
            group: 'inline',
            selectable: false,
            toDOM() {
                return ['br'];
            },
        },
        fromYfm: {tokenName: 'softbreak', tokenSpec: {name: softBreak, type: 'node'}},
        toYfm: (state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++) {
                if (parent.child(i).type !== node.type) {
                    state.write('\n');
                    return;
                }
            }
        },
    }));

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

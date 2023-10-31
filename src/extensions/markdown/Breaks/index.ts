import type {Node, NodeType} from 'prosemirror-model';
import {TextSelection} from 'prosemirror-state';
import {chainCommands, exitCode} from 'prosemirror-commands';
import {logger} from '../../../logger';
import type {ExtensionAuto, Keymap} from '../../../core';
import {isMac} from '../../../utils/platform';
import {isTextSelection} from '../../../utils/selection';
import {BreaksSpecs, BreaksSpecsOptions, hbType, sbType} from './BreaksSpecs';
import {pType} from '../../base/BaseSchema/BaseSchemaSpecs';

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
        const {selection: sel, schema} = state;
        if (
            !isTextSelection(sel) ||
            !sel.empty ||
            // breaks can only be in the paragraph
            sel.$cursor?.parent.type !== pType(schema)
        )
            return false;

        if (isBreakNode(sel.$cursor.nodeBefore)) {
            if (dispatch) {
                const {
                    $cursor,
                    $cursor: {pos},
                } = sel;
                const from = isBreakNode($cursor.nodeAfter) ? pos + 1 : pos;
                const posEnd = $cursor.end();
                const posAfter = $cursor.after();

                const contentAfter = state.doc.slice(from, posEnd, false).content;

                let tr = state.tr.insert(posAfter, pType(schema).create(null, contentAfter));
                tr = tr
                    .setSelection(TextSelection.create(tr.doc, posAfter + 1))
                    .scrollIntoView()
                    .delete(pos, posEnd) // remove content after current pos (it's moved to next para)
                    .delete(pos - 1, pos); // remove break before current pos ($cursor.nodeBefore)
                dispatch(tr);
            }
            return true;
        }

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

function isBreakNode(node?: Node | null | undefined): boolean {
    return Boolean(node?.type.spec.isBreak);
}

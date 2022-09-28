import log from '@doc-tools/transform/lib/log';
import yfmPlugin from '@doc-tools/transform/lib/plugins/notes';
import {chainCommands} from 'prosemirror-commands';
import {Action, createExtension, ExtensionAuto} from '../../../core';
import {toYfm} from './toYfm';
import {NoteNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec, YfmNoteSpecOptions} from './spec';
import {createYfmNote, toYfmNote} from './actions/toYfmNote';
import {nodeInputRule} from '../../../utils/inputrules';
import {exitFromNoteTitle, removeNote} from './commands';
import {noteType} from './utils';

import './index.scss';

const noteAction = 'toYfmNote';

export {noteType, noteTitleType} from './utils';

export type YfmNoteOptions = YfmNoteSpecOptions & {
    yfmNoteKey?: string | null;
};

export const YfmNote: ExtensionAuto<YfmNoteOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(NoteNode.Note, () => ({
            spec: spec[NoteNode.Note],
            toYfm: toYfm[NoteNode.Note],
            fromYfm: {
                tokenSpec: fromYfm[NoteNode.Note],
            },
        }))
        .addNode(NoteNode.NoteTitle, () => ({
            spec: spec[NoteNode.NoteTitle],
            toYfm: toYfm[NoteNode.NoteTitle],
            fromYfm: {
                tokenSpec: fromYfm[NoteNode.NoteTitle],
            },
        }))
        .addKeymap(() => ({
            Enter: exitFromNoteTitle,
            Backspace: chainCommands(removeNote),
        }))
        .addAction(noteAction, () => toYfmNote)
        .addInputRules(({schema}) => ({
            rules: [nodeInputRule(/(?:^)({% note)\s$/, noteType(schema).createAndFill(), 1)],
        }));

    if (opts?.yfmNoteKey) {
        const {yfmNoteKey} = opts;
        builder.addKeymap(() => ({[yfmNoteKey]: createYfmNote}));
    }
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const YfmNoteE = createExtension<YfmNoteOptions>((b, o = {}) => b.use(YfmNote, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [noteAction]: Action;
        }
    }
}

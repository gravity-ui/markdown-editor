import {chainCommands} from 'prosemirror-commands';
import type {Action, ExtensionAuto} from '../../../core';
import {createYfmNote, toYfmNote} from './actions/toYfmNote';
import {nodeInputRule} from '../../../utils/inputrules';
import {backToNoteTitle, exitFromNoteTitle, removeNote} from './commands';
import {noteType} from './utils';
import {YfmNoteSpecs, YfmNoteSpecsOptions} from './YfmNoteSpecs';

import './index.scss';

const noteAction = 'toYfmNote';

export {YfmNoteNode, noteType, noteTitleType} from './YfmNoteSpecs';

export type YfmNoteOptions = YfmNoteSpecsOptions & {
    yfmNoteKey?: string | null;
};

export const YfmNote: ExtensionAuto<YfmNoteOptions> = (builder, opts) => {
    builder.use(YfmNoteSpecs, opts);

    builder
        .addKeymap(() => ({
            Enter: exitFromNoteTitle,
            Backspace: chainCommands(backToNoteTitle, removeNote),
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

declare global {
    namespace YfmEditor {
        interface Actions {
            [noteAction]: Action;
        }
    }
}

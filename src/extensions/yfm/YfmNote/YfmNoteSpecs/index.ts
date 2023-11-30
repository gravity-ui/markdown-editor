import log from '@diplodoc/transform/lib/log';
import yfmPlugin from '@diplodoc/transform/lib/plugins/notes';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';
import {toYfm} from './toYfm';
import {NoteNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';

export {NoteNode as YfmNoteNode} from './const';
export {noteType, noteTitleType} from './utils';

export type YfmNoteSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmNoteTitlePlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const YfmNoteSpecs: ExtensionAuto<YfmNoteSpecsOptions> = (builder, opts) => {
    const spec = getSpec(opts, builder.context.get('placeholder'));

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
        .addNode(NoteNode.NoteContent, () => ({
            spec: spec[NoteNode.NoteContent],
            toYfm: toYfm[NoteNode.NoteContent],
            fromYfm: {
                tokenSpec: fromYfm[NoteNode.NoteContent],
            },
        }));
};

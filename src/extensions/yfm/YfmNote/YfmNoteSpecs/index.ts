import log from '@diplodoc/transform/lib/log';
import yfmPlugin from '@diplodoc/transform/lib/plugins/notes';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';

import {NoteNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

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
            toMd: toYfm[NoteNode.Note],
            fromMd: {
                tokenSpec: fromYfm[NoteNode.Note],
            },
        }))
        .addNode(NoteNode.NoteTitle, () => ({
            spec: spec[NoteNode.NoteTitle],
            toMd: toYfm[NoteNode.NoteTitle],
            fromMd: {
                tokenSpec: fromYfm[NoteNode.NoteTitle],
            },
        }))
        .addNode(NoteNode.NoteContent, () => ({
            spec: spec[NoteNode.NoteContent],
            toMd: toYfm[NoteNode.NoteContent],
            fromMd: {
                tokenSpec: fromYfm[NoteNode.NoteContent],
            },
        }));
};

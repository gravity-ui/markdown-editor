import {log} from '@diplodoc/transform/lib/log.js';
import yfmPlugin from '@diplodoc/transform/lib/plugins/notes/index.js';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '../../../../core';

import {NoteNode} from './const';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {NoteNode as YfmNoteNode} from './const';
export {noteType, noteTitleType} from './utils';

export type YfmNoteSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    yfmNoteTitlePlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

export const YfmNoteSpecs: ExtensionAuto<YfmNoteSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts, builder.context.get('placeholder'));

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(NoteNode.Note, () => ({
            spec: schemaSpecs[NoteNode.Note],
            toMd: serializerTokens[NoteNode.Note],
            fromMd: {
                tokenSpec: parserTokens[NoteNode.Note],
            },
        }))
        .addNode(NoteNode.NoteTitle, () => ({
            spec: schemaSpecs[NoteNode.NoteTitle],
            toMd: serializerTokens[NoteNode.NoteTitle],
            fromMd: {
                tokenSpec: parserTokens[NoteNode.NoteTitle],
            },
        }))
        .addNode(NoteNode.NoteContent, () => ({
            spec: schemaSpecs[NoteNode.NoteContent],
            toMd: serializerTokens[NoteNode.NoteContent],
            fromMd: {
                tokenSpec: parserTokens[NoteNode.NoteContent],
            },
        }));
};

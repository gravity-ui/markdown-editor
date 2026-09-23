import type {ExtensionAuto} from '#core';

import {YfmNoteParserSpecs} from './parser';
import {type YfmNoteSchemaOptions, YfmNoteSchemaSpecs} from './schema';
import {YfmNoteSerializerSpecs} from './serializer';

export {NoteNode as YfmNoteNode} from './const';
export {noteType, noteTitleType} from './utils';
export type {YfmNoteSchemaOptions} from './schema';

export type YfmNoteSpecsOptions = YfmNoteSchemaOptions & {};

export const YfmNoteSpecs: ExtensionAuto<YfmNoteSpecsOptions> = (builder, opts) => {
    builder.use(YfmNoteSchemaSpecs, opts).use(YfmNoteParserSpecs).use(YfmNoteSerializerSpecs);
};

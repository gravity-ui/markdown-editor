import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {DeflistNode} from './const';
import {DeflistParserSpecs} from './parser';
import {type DeflistSchemaOptions, DeflistSchemaSpecs} from './schema';
import {DeflistSerializerSpecs} from './serializer';

export {DeflistNode} from './const';
export const defListType = nodeTypeFactory(DeflistNode.List);
export const defTermType = nodeTypeFactory(DeflistNode.Term);
export const defDescType = nodeTypeFactory(DeflistNode.Desc);

export type {DeflistSchemaOptions} from './schema';

export type DeflistSpecsOptions = DeflistSchemaOptions & {};

export const DeflistSpecs: ExtensionAuto<DeflistSpecsOptions> = (builder, opts) => {
    builder.use(DeflistSchemaSpecs, opts).use(DeflistParserSpecs).use(DeflistSerializerSpecs);
};

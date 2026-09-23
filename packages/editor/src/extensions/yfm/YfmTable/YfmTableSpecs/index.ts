import type {ExtensionWithOptions} from '#core';

import {type YfmTableParserOptions, YfmTableParserSpecs} from './parser';
import {type YfmTableSchemaOptions, YfmTableSchemaSpecs} from './schema';
import {YfmTableSerializerSpecs} from './serializer';

export {YfmTableNode} from './const';
export {yfmTableType, yfmTableBodyType, yfmTableRowType, yfmTableCellType} from './utils';

export type YfmTableSpecsOptions = YfmTableSchemaOptions & YfmTableParserOptions & {};

export const YfmTableSpecs: ExtensionWithOptions<YfmTableSpecsOptions> = (builder, options) => {
    builder
        .use(YfmTableSchemaSpecs, options)
        .use(YfmTableParserSpecs, options)
        .use(YfmTableSerializerSpecs);
};

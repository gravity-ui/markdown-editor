import type {ExtensionAuto} from '../../../../core';

import {TableNode} from './const';
import {parserTokens} from './parser';
import {schemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {TableNode} from './const';

export const TableSpecs: ExtensionAuto = (builder) => {
    builder
        .addNode(TableNode.Table, () => ({
            spec: schemaSpecs[TableNode.Table],
            toMd: serializerTokens[TableNode.Table],
            fromMd: {tokenSpec: parserTokens[TableNode.Table]},
        }))
        .addNode(TableNode.Head, () => ({
            spec: schemaSpecs[TableNode.Head],
            toMd: serializerTokens[TableNode.Head],
            fromMd: {tokenSpec: parserTokens[TableNode.Head]},
        }))
        .addNode(TableNode.Body, () => ({
            spec: schemaSpecs[TableNode.Body],
            toMd: serializerTokens[TableNode.Body],
            fromMd: {tokenSpec: parserTokens[TableNode.Body]},
        }))
        .addNode(TableNode.Row, () => ({
            spec: schemaSpecs[TableNode.Row],
            toMd: serializerTokens[TableNode.Row],
            fromMd: {tokenSpec: parserTokens[TableNode.Row]},
        }))
        .addNode(TableNode.HeaderCell, () => ({
            spec: schemaSpecs[TableNode.HeaderCell],
            toMd: serializerTokens[TableNode.HeaderCell],
            fromMd: {tokenSpec: parserTokens[TableNode.HeaderCell]},
        }))
        .addNode(TableNode.DataCell, () => ({
            spec: schemaSpecs[TableNode.DataCell],
            toMd: serializerTokens[TableNode.DataCell],
            fromMd: {tokenSpec: parserTokens[TableNode.DataCell]},
        }));
};

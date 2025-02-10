import {ProcessNode, ProcessNodeAttrs, ProcessToken} from '../markdown/MarkdownParser';
import {SerializerProcessNode} from '../markdown/MarkdownSerializerDynamicModifier';

export type DynamicModifiers =
    | ParserTokenModifier
    | ParserNodeAttrsModifier
    | ParserNodeModifier
    | SerializerNodeModifier
    | SchemaNodeSpecModifier;

export type ParserTokenModifier = {
    type: 'parserToken';
    tokenName: string;
    process: ProcessToken;
};

export type ParserNodeAttrsModifier = {
    type: 'parserNodeAttrs';
    tokenName: string;
    process: ProcessNodeAttrs;
};

export type ParserNodeModifier = {
    type: 'parserNode';
    nodeName: string;
    process: ProcessNode;
};

export type SerializerNodeModifier = {
    type: 'serializerNode';
    nodeName: string;
    process: SerializerProcessNode;
};

export type SchemaNodeSpecModifier = {
    type: 'schemaNodeSpec';
    nodeName: string;
    allowedAttrs: string[];
};

import type {ProcessNode, ProcessNodeAttrs, ProcessToken} from '../markdown/MarkdownParser';
import type {SerializerProcessNode} from '../markdown/MarkdownSerializerDynamicModifier';

/** @internal */
export type DynamicModifiers =
    | ParserTokenModifier
    | ParserNodeAttrsModifier
    | ParserNodeModifier
    | SerializerNodeModifier
    | SchemaNodeSpecModifier;

/** @internal */
export type ParserTokenModifier = {
    type: 'parserToken';
    tokenName: string;
    process: ProcessToken;
};

/** @internal */
export type ParserNodeAttrsModifier = {
    type: 'parserNodeAttrs'; // TODO: fix name
    tokenName: string;
    process: ProcessNodeAttrs;
};

/** @internal */
export type ParserNodeModifier = {
    type: 'parserNode';
    nodeName: string;
    process: ProcessNode;
};

/** @internal */
export type SerializerNodeModifier = {
    type: 'serializerNode';
    nodeName: string;
    process: SerializerProcessNode;
};

/** @internal */
export type SchemaNodeSpecModifier = {
    type: 'schemaNodeSpec';
    nodeName: string;
    allowedAttrs: string[];
};

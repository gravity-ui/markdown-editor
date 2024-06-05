import type MarkdownIt from 'markdown-it';
import type OrderedMap from 'orderedmap'; // eslint-disable-line import/no-extraneous-dependencies
import type {MarkSpec, NodeSpec, Schema} from 'prosemirror-model';
import type {Plugin} from 'prosemirror-state';

import type {ExtensionBuilder} from '../ExtensionBuilder';

import type {ActionSpec, ActionStorage} from './actions';
import type {MarkViewConstructor, NodeViewConstructor} from './node-views';
import type {Parser, ParserToken} from './parser';
import type {Serializer, SerializerMarkToken, SerializerNodeToken} from './serializer';

export type Extension = (builder: ExtensionBuilder) => void;
export type ExtensionWithOptions<T> = (builder: ExtensionBuilder, options: T) => void;
export type ExtensionAuto<T = void> = T extends void ? Extension : ExtensionWithOptions<T>;

export type ExtensionSpec = {
    configureMd(md: MarkdownIt, parserType: 'text' | 'markup'): MarkdownIt;
    nodes(): OrderedMap<ExtensionNodeSpec>;
    marks(): OrderedMap<ExtensionMarkSpec>;
    plugins(deps: ExtensionDeps): Plugin[];
    actions(deps: ExtensionDeps): Record<string, ActionSpec>;
};

export type ExtensionNodeSpec = {
    spec: NodeSpec;
    view?: (deps: ExtensionDeps) => NodeViewConstructor;
    fromMd: {
        tokenName?: string;
        tokenSpec: ParserToken;
    };
    toMd: SerializerNodeToken;
};

export type ExtensionMarkSpec = {
    spec: MarkSpec;
    view?: (deps: ExtensionDeps) => MarkViewConstructor;
    fromMd: {
        tokenName?: string;
        tokenSpec: ParserToken;
    };
    toMd: SerializerMarkToken;
};

export type ExtensionDeps = {
    readonly schema: Schema;
    readonly textParser: Parser;
    readonly markupParser: Parser;
    readonly serializer: Serializer;
    readonly actions: ActionStorage;
};

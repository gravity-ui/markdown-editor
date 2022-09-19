import type OrderedMap from 'orderedmap';
import type MarkdownIt from 'markdown-it';
import type {Plugin} from 'prosemirror-state';
import type {MarkSpec, NodeSpec, Schema} from 'prosemirror-model';

import type {ExtensionBuilder} from '../ExtensionBuilder';
import type {ActionSpec, ActionStorage} from './actions';
import type {MarkViewConstructor, NodeViewConstructor} from './node-views';
import type {Parser, ParserToken} from './parser';
import type {Serializer, SerializerNodeToken, SerializerMarkToken} from './serializer';

export type Extension = (builder: ExtensionBuilder) => void;
export type ExtensionWithOptions<T> = (builder: ExtensionBuilder, options: T) => void;
export type ExtensionAuto<T = void> = T extends void ? Extension : ExtensionWithOptions<T>;

export type ExtensionSpec = {
    configureMd(md: MarkdownIt): MarkdownIt;
    nodes(): OrderedMap<YENodeSpec>;
    marks(): OrderedMap<YEMarkSpec>;
    plugins(deps: ExtensionDeps): {plugin: Plugin; priority: number}[];
    actions(deps: ExtensionDeps): Record<string, ActionSpec>;
};

export type YENodeSpec = {
    spec: NodeSpec;
    view?: (deps: ExtensionDeps) => NodeViewConstructor;
    fromYfm: {
        tokenName?: string;
        tokenSpec: ParserToken;
    };
    toYfm: SerializerNodeToken;
};

export type YEMarkSpec = {
    spec: MarkSpec;
    view?: (deps: ExtensionDeps) => MarkViewConstructor;
    fromYfm: {
        tokenName?: string;
        tokenSpec: ParserToken;
    };
    toYfm: SerializerMarkToken;
};

export type ExtensionDeps = {
    readonly schema: Schema;
    readonly parser: Parser;
    readonly parserWithoutAttrs: Parser;
    readonly serializer: Serializer;
    readonly actions: ActionStorage;
};

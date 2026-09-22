import {type EditorState, type Extension, Facet, type Text} from '@codemirror/state';
import type {SyntaxNode} from '@lezer/common';
import type {MarkdownConfig} from '@lezer/markdown' with {'resolution-mode': 'import'};

import {markdownSyntax} from '../../../markup/codemirror/markdown-syntax';
import type {ResourceLinkCodec} from '../urls';

export type {ResourceLinkCodec} from '../urls';

/** A half-open source range, in CodeMirror document positions. */
export type ResourceSourceRange = {from: number; to: number};

/** A Markdown link definition; its value is a parsed URL. */
export type ResourceDefinition = {
    range: ResourceSourceRange;
    valueRange: ResourceSourceRange;
    value: string;
    title?: string;
};

export type ResourceSyntaxMatch = {
    /** Complete resource syntax, including its delimiters. */
    range: ResourceSourceRange;
    /** Source contents to replace, excluding delimiters handled by the surrounding syntax. */
    valueRange: ResourceSourceRange;
    /** Parsed attributes. Opaque values must retain their exact spelling and case. */
    attrs: Readonly<Record<string, unknown>>;
    /** Pure serialization into valueRange; escape for this syntax or throw if unrepresentable. */
    serialize(value: string): string;
    /** Reference images replace their own suffix, never the shared definition. */
    reference?: {
        labelTo: number;
        title?: string;
        /** The selected definition must also be inserted to start a replacement request. */
        definitionRange: ResourceSourceRange;
    };
};

export type ResourceSyntaxContext = {
    /** Configuration state; use doc for source positions during a transaction. */
    state: EditorState;
    node: SyntaxNode;
    doc: Text;
    definitions: ReadonlyMap<string, ResourceDefinition>;
    urls: ResourceLinkCodec;
};

/** An explicit bridge between a schema node and its CodeMirror syntax. */
export type CodeMirrorResourceHandler = {
    nodeType: string;
    /** Schema attribute represented by the returned value range. */
    valueAttribute: string;
    /** Optional grammar extension installed into the editor's Markdown language. */
    syntax?: MarkdownConfig;
    syntaxNodes: readonly string[];
    /** Pure extraction; attrs must correspond to the selected schema node. */
    read(context: ResourceSyntaxContext): ResourceSyntaxMatch | undefined;
};

export const resourceHandlers = Facet.define<CodeMirrorResourceHandler>();

/** Install resource extraction and optional syntax together, through ordinary CM extensions. */
export function codeMirrorResourceSupport(handler: CodeMirrorResourceHandler): Extension {
    return [resourceHandlers.of(handler), handler.syntax ? markdownSyntax.of(handler.syntax) : []];
}

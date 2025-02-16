import type MarkdownIt from 'markdown-it';
import type {Schema} from 'prosemirror-model';

import {MarkdownParser, type MarkdownParserDynamicModifier} from './markdown/MarkdownParser';
import type {TransformFn} from './markdown/ProseMirrorTransformer';
import type {Parser, ParserToken} from './types/parser';

export class ParserTokensRegistry {
    #tokens: Record<string, ParserToken> = {};

    addToken(name: string, token: ParserToken) {
        this.#tokens[name] = token;
        return this;
    }

    createParser(
        schema: Schema,
        tokenizer: MarkdownIt,
        pmTransformers: TransformFn[],
        dynamicModifier?: MarkdownParserDynamicModifier,
    ): Parser {
        return new MarkdownParser(schema, tokenizer, this.#tokens, pmTransformers, dynamicModifier);
    }
}

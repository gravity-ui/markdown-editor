import type MarkdownIt from 'markdown-it';
import type {Schema} from 'prosemirror-model';

import {MarkdownParser} from './markdown/MarkdownParser';
import type {Parser, ParserToken} from './types/parser';

export class ParserTokensRegistry {
    #tokens: Record<string, ParserToken> = {};

    addToken(name: string, token: ParserToken) {
        this.#tokens[name] = token;
        return this;
    }

    createParser(schema: Schema, tokenizer: MarkdownIt): Parser {
        return new MarkdownParser(schema, tokenizer, this.#tokens);
    }
}

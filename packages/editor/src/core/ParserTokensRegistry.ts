import type MarkdownIt from 'markdown-it';
import type {Schema} from 'prosemirror-model';

import type {Logger2} from '../logger';

import {MarkdownParser, type MarkdownParserDynamicModifier} from './markdown/MarkdownParser';
import type {TransformFn} from './markdown/ProseMirrorTransformer';
import type {Parser, ParserToken} from './types/parser';

type ParserTokensRegistryOptions = {
    logger: Logger2.ILogger;
};

export class ParserTokensRegistry {
    #tokens: Record<string, ParserToken> = {};
    #logger: Logger2.ILogger;

    constructor(opts: ParserTokensRegistryOptions) {
        this.#logger = opts.logger;
    }

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
        return new MarkdownParser(schema, tokenizer, this.#tokens, {
            logger: this.#logger,
            pmTransformers,
            dynamicModifier,
        });
    }
}

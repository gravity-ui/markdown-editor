import type Token from 'markdown-it/lib/token';
import type {Node} from 'prosemirror-model';

export interface Parser {
    /** Parse raw markup to prosemirror's root node */
    parse(markup: string): Node;
    validateLink(url: string): boolean;
    normalizeLink(url: string): string;
    normalizeLinkText(url: string): string;
}

export interface ParserToken {
    name: string;
    type: 'node' | 'block' | 'mark';
    attrs?: {[name: string]: unknown};
    getAttrs?: (token: Token, tokens: Token[], index: number) => NonNullable<ParserToken['attrs']>;
    // Значит что нет закрывающего токена.
    // То есть контент лежит в поле content токена, а не между открывающим и закрывающим токенами.
    noCloseToken?: boolean;
    ignore?: boolean;
}

import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type {Node} from 'prosemirror-model';

export type LinkMatch = Readonly<NonNullable<ReturnType<MarkdownIt['linkify']['match']>>[number]>;

export interface Parser {
    /** Parse raw markup to prosemirror's root node */
    parse(markup: string): Node;
    /** Parse markdown-it tokens stream to prosemirror's root node */
    parse(tokens: Token[]): Node;
    validateLink(url: string): boolean;
    normalizeLink(url: string): string;
    normalizeLinkText(url: string): string;
    matchLinks(text: string): LinkMatch[] | null;
}

export interface ParserToken {
    name: string;
    type: 'node' | 'block' | 'mark';
    attrs?: {[name: string]: unknown};
    getAttrs?: (token: Token, tokens: Token[], index: number) => NonNullable<ParserToken['attrs']>;
    // It means that there is no closing token
    // That is, the content lies in the content field of the token, and not between the opening and closing tokens.
    noCloseToken?: boolean;
    ignore?: boolean;
    code?: boolean;
    /** only for tokens with type=block */
    prepareContent?: (content: string) => string;
    /**
     * only for tokens with type=block and noCloseToken=true
     * @default 'content'
     */
    contentField?: 'content' | 'children';
}

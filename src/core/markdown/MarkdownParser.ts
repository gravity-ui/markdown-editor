import type {Match} from 'linkify-it'; // eslint-disable-line import/no-extraneous-dependencies
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {Mark, MarkType, Node, NodeType, Schema} from 'prosemirror-model';

import {logger} from '../../logger';
import type {Parser, ParserToken} from '../types/parser';

import {MarkupManager} from './MarkupManager';
import {ProseMirrorTransformer, TransformFn} from './ProseMirrorTransformer';

type TokenAttrs = {[name: string]: unknown};

const openSuffix = '_open';
const closeSuffix = '_close';
enum TokenType {
    open = 'open',
    close = 'close',
    default = 'default',
}

/**
 * Generate a unique token ID
 */
export function createUniqueId(prefix: string): string {
    const randomLetters = Array.from(
        {length: 5},
        () => String.fromCharCode(97 + Math.floor(Math.random() * 26)), // a-z
    ).join('');

    return `${prefix}-${randomLetters}${Date.now()}`;
}

export class MarkdownParser implements Parser {
    schema: Schema;
    stack: Array<{type: NodeType; attrs?: TokenAttrs; content: Array<Node>}> = [];
    marks: readonly Mark[];
    tokens: Record<string, ParserToken>;
    tokenizer: MarkdownIt;
    pmTransformers: TransformFn[];
    markupManager: MarkupManager;

    constructor(
        schema: Schema,
        tokenizer: MarkdownIt,
        tokens: Record<string, ParserToken>,
        pmTransformers: TransformFn[],
        markupManager: MarkupManager,
    ) {
        this.schema = schema;
        this.marks = Mark.none;
        this.tokens = tokens;
        this.tokenizer = tokenizer;
        this.pmTransformers = pmTransformers;
        this.markupManager = markupManager;
    }

    validateLink(url: string): boolean {
        return this.tokenizer.validateLink(url);
    }

    normalizeLink(url: string): string {
        return this.tokenizer.normalizeLink(url);
    }

    normalizeLinkText(url: string): string {
        return this.tokenizer.normalizeLinkText(url);
    }

    matchLinks(text: string): Readonly<Match>[] | null {
        return this.tokenizer.linkify.match(text);
    }

    parse(text: string) {
        const time = Date.now();
        this.markupManager.setMarkup(text);

        try {
            this.stack = [{type: this.schema.topNodeType, content: []}];

            let mdItTokens;
            try {
                mdItTokens = this.tokenizer.parse(text, {});
                if (this.markupManager.isAllowDynamicAttributesForTrackedEntities()) {
                    mdItTokens.forEach((token) => {
                        if (this.markupManager.isTrackedTokenType(token.type) && token.map) {
                            const tokenId = createUniqueId(token.type);
                            token.attrSet('tokenId', tokenId);
                            this.markupManager.setPos(tokenId, token.map);
                        }
                    });
                }
            } catch (err) {
                const e = err as Error;
                e.message = 'Unable to parse your markup. Please check for errors. ' + e.message;
                throw e;
            }

            this.parseTokens(mdItTokens);

            let doc;

            // If after parsing there are still unclosed nodes, close them by removing them from the stack.
            do {
                doc = this.closeNode();
            } while (this.stack.length);

            const pmTransformer = new ProseMirrorTransformer(this.pmTransformers);

            return doc ? pmTransformer.transform(doc) : this.schema.topNodeType.createAndFill()!;
        } finally {
            logger.metrics({component: 'parser', event: 'parse', duration: Date.now() - time});
        }
    }

    private top() {
        return this.stack[this.stack.length - 1];
    }

    private push(elt: Node) {
        if (this.stack.length) this.top().content.push(elt);
    }

    //#region helpers

    private getTokenAttrs(
        token: Token,
        tokenSpec: ParserToken,
        tokenStream: Token[],
        i: number,
    ): TokenAttrs | undefined {
        let attrs: TokenAttrs | undefined = {};

        if (tokenSpec.getAttrs) {
            attrs = tokenSpec.getAttrs(token, tokenStream, i);
        } else if (tokenSpec.attrs instanceof Function) {
            attrs = tokenSpec.attrs(token);
        } else {
            attrs = tokenSpec.attrs;
        }

        // Inject nodeId attr if the markdown token has tokenId
        const tokdenId = token.attrGet('tokenId');
        if (tokdenId) {
            attrs = attrs ?? {};
            attrs.nodeId = tokdenId;
        }

        // TODO: @makhnatkin add cache
        return attrs;
    }

    private getTokenSpec(token: Token) {
        // Matching the pm-node meta-attribute which is set in the plugin for markdown-it
        let tokName = (token.meta?.['pm-node'] as string) || token.type;

        // Cropping _open and _close from node name end
        // e.g. paragraph_open -> paragraph
        tokName = tokName.replace(new RegExp(`(${openSuffix})$|(${closeSuffix})$`), '');

        let tokenSpec: ParserToken | undefined;

        if (tokName in this.tokens) tokenSpec = this.tokens[tokName];

        if (!tokenSpec) throw new RangeError(`No token spec for token: ${JSON.stringify(token)}`);

        return tokenSpec;
    }

    // Getting token type from its name
    // e.g. "paragraph_open" - is opening token for paragraph
    private getTokenType({type}: Token): keyof typeof TokenType {
        if (type.endsWith(openSuffix)) return TokenType.open;
        if (type.endsWith(closeSuffix)) return TokenType.close;

        return TokenType.default;
    }

    //#endregion

    //#region token handlers

    // Self-explanatory
    private handlePrimitiveToken(token: Token) {
        switch (token.type) {
            case 'text':
                this.addText(withoutTrailingNewline(token.content));
                return true;
            case 'inline':
                this.parseTokens(token.children || []);
                return true;
            case 'softbreak':
                // TODO: move all primitive token's handlers to extensions
                if (this.tokens.softbreak) return false;
                this.addText('\n');
                return true;
        }

        return false;
    }

    private handleMark(token: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        const schemaSpec = this.schema.marks[tokenSpec.name];

        if (tokenSpec.noCloseToken) {
            this.openMark(schemaSpec.create(attrs));
            let {content} = token;
            if (!tokenSpec.code) content = withoutTrailingNewline(content);
            this.addText(content);
            this.closeMark(schemaSpec);

            return;
        }

        switch (this.getTokenType(token)) {
            case 'open': {
                this.openMark(schemaSpec.create(attrs));

                break;
            }
            case 'close': {
                this.closeMark(schemaSpec);

                break;
            }
        }
    }

    private handleNode(_token: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        const schemaSpec = this.schema.nodes[tokenSpec.name];

        // Adding node as is, becasuse it doesn't contain content.
        this.addNode(schemaSpec, attrs);
    }

    private handleBlock(token: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        const schemaSpec = this.schema.nodes[tokenSpec.name];

        if (tokenSpec.noCloseToken) {
            this.openNode(schemaSpec, attrs);

            if (tokenSpec.contentField === 'children' && token.children?.length) {
                this.parseTokens(token.children);
            } else {
                let {content} = token;
                if (tokenSpec.prepareContent) {
                    content = tokenSpec.prepareContent(content);
                }
                this.addText(content);
            }

            this.closeNode();
            return;
        }

        switch (this.getTokenType(token)) {
            case 'open': {
                this.openNode(schemaSpec, attrs);

                break;
            }
            case 'close': {
                this.closeNode();

                break;
            }
        }
    }

    private handleToken(token: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        switch (tokenSpec.type) {
            case 'mark':
                this.handleMark(token, tokenSpec, attrs);
                break;
            case 'node':
                this.handleNode(token, tokenSpec, attrs);
                break;
            case 'block':
                this.handleBlock(token, tokenSpec, attrs);
                break;
        }
    }

    //#endregion

    //#region state methods

    private addNode(type: NodeType, attrs?: Object, content?: Node[]) {
        const node = type.createAndFill(attrs, content, this.marks);
        if (!node) return null;
        this.push(node);

        return node;
    }

    private openNode(type: NodeType, attrs?: TokenAttrs) {
        this.stack.push({type: type, attrs, content: []});
    }

    private closeNode() {
        // Marks operate within a node. Therefore, when we close the node, we reset the existing marks.
        if (this.marks.length) this.marks = Mark.none;
        const info = this.stack.pop();
        if (info) return this.addNode(info.type, info.attrs, info.content);

        return null;
    }

    private addText(text: string) {
        if (!text) return;
        const nodes = this.top().content;
        const last = nodes[nodes.length - 1];
        const node = this.schema.text(text, this.marks);
        let merged;
        if (last && (merged = maybeMerge(last, node))) nodes[nodes.length - 1] = merged;
        else nodes.push(node);
    }

    // Adding mark to a set of open marks
    private openMark(mark: Mark) {
        this.marks = mark.addToSet(this.marks);
    }

    private closeMark(mark: MarkType) {
        this.marks = mark.removeFromSet(this.marks);
    }

    //#endregion

    private parseTokens(tokens: Token[]) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (this.handlePrimitiveToken(token)) continue;

            const tokenSpec = this.getTokenSpec(token);

            if (tokenSpec.ignore) continue;

            const attrs = this.getTokenAttrs(token, tokenSpec, tokens, i);

            this.handleToken(token, tokenSpec, attrs);
        }
    }
}

// Checking if these are two text nodes and they have the same marks, then it merges them into one.
function maybeMerge(a: Node, b: Node) {
    if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) {
        // Somehow this method is not in typings but it exists.
        // @ts-expect-error
        return a.withText(a.text + b.text);
    }
}

function withoutTrailingNewline(str: string) {
    return str[str.length - 1] === '\n' || str.endsWith('\\n') ? str.slice(0, str.length - 1) : str;
}

import type {Match} from 'linkify-it';
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {Mark, MarkType, Node, NodeType, Schema} from 'prosemirror-model';
import type {Parser, ParserToken} from '../types/parser';
import {logger} from '../../logger';

type TokenAttrs = {[name: string]: unknown};

const openSuffix = '_open';
const closeSuffix = '_close';
enum TokenType {
    open = 'open',
    close = 'close',
    default = 'default',
}

export class MarkdownParser implements Parser {
    schema: Schema;
    stack: Array<{type: NodeType; attrs?: TokenAttrs; content: Array<Node>}> = [];
    marks: readonly Mark[];
    tokens: Record<string, ParserToken>;
    tokenizer: MarkdownIt;

    constructor(schema: Schema, tokenizer: MarkdownIt, tokens: Record<string, ParserToken>) {
        this.schema = schema;
        this.marks = Mark.none;
        this.tokens = tokens;
        this.tokenizer = tokenizer;
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
        try {
            this.stack = [{type: this.schema.topNodeType, content: []}];

            let yfmTokens;
            try {
                yfmTokens = this.tokenizer.parse(text, {});
            } catch (err) {
                const e = err as Error;
                e.message = 'Unable to parse your markup. Please check for errors. ' + e.message;
                throw e;
            }

            this.parseTokens(yfmTokens);

            let doc;

            // Если после парсинга остались незакрытые ноды - закрываем их, вытаскивая из стэка.
            do {
                doc = this.closeNode();
            } while (this.stack.length);

            return (doc || this.schema.topNodeType.createAndFill()) as Node;
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
        yfmToken: Token,
        tokenSpec: ParserToken,
        tokenStream: Token[],
        i: number,
    ): TokenAttrs | undefined {
        if (tokenSpec.getAttrs) return tokenSpec.getAttrs(yfmToken, tokenStream, i);
        else if (tokenSpec.attrs instanceof Function) return tokenSpec.attrs(yfmToken);

        return tokenSpec.attrs;
    }

    private getTokenSpec(yfmToken: Token) {
        // Матчимся на мета-аттрибут pm-node который проставляется в плагине для markdown-it
        let tokName = (yfmToken.meta?.['pm-node'] as string) || yfmToken.type;

        // Отрезаем _open и _close с конца названия
        // e.g. paragraph_open -> paragraph
        tokName = tokName.replace(new RegExp(`(${openSuffix})$|(${closeSuffix})$`), '');

        let tokenSpec: ParserToken | undefined;

        if (tokName in this.tokens) tokenSpec = this.tokens[tokName];

        if (!tokenSpec)
            throw new RangeError(`No token spec for token: ${JSON.stringify(yfmToken)}`);

        return tokenSpec;
    }

    // Получаем тип токена из его названия
    // Например "paragraph_open" - открывающий токен для paragraph
    private getTokenType({type}: Token): keyof typeof TokenType {
        if (type.endsWith(openSuffix)) return TokenType.open;
        if (type.endsWith(closeSuffix)) return TokenType.close;

        return TokenType.default;
    }

    //#endregion

    //#region token handlers

    // Self-explanatory
    private handlePrimitiveToken(yfmToken: Token) {
        switch (yfmToken.type) {
            case 'text':
                this.addText(withoutTrailingNewline(yfmToken.content));
                return true;
            case 'inline':
                this.parseTokens(yfmToken.children || []);
                return true;
            case 'softbreak':
                // TODO: move all primitive token's handlers to extensions
                if (this.tokens.softbreak) return false;
                this.addText('\n');
                return true;
        }

        return false;
    }

    private handleMark(yfmToken: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        const schemaSpec = this.schema.marks[tokenSpec.name];

        if (tokenSpec.noCloseToken) {
            this.openMark(schemaSpec.create(attrs));
            this.addText(withoutTrailingNewline(yfmToken.content));
            this.closeMark(schemaSpec);

            return;
        }

        switch (this.getTokenType(yfmToken)) {
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

    private handleNode(_yfmToken: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        const schemaSpec = this.schema.nodes[tokenSpec.name];

        // Ноду добавляем as is, потому что у нее нет вложенного контента.
        this.addNode(schemaSpec, attrs);
    }

    private handleBlock(yfmToken: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        const schemaSpec = this.schema.nodes[tokenSpec.name];

        if (tokenSpec.noCloseToken) {
            this.openNode(schemaSpec, attrs);
            let {content} = yfmToken;
            if (tokenSpec.prepareContent) {
                content = tokenSpec.prepareContent(content);
            }
            this.addText(content);
            this.closeNode();

            return;
        }

        switch (this.getTokenType(yfmToken)) {
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

    private handleToken(yfmToken: Token, tokenSpec: ParserToken, attrs?: TokenAttrs) {
        switch (tokenSpec.type) {
            case 'mark':
                this.handleMark(yfmToken, tokenSpec, attrs);
                break;
            case 'node':
                this.handleNode(yfmToken, tokenSpec, attrs);
                break;
            case 'block':
                this.handleBlock(yfmToken, tokenSpec, attrs);
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
        // Марки действуют в рамках ноды. Поэтому когда закрываем ноду - обнуляем действующие марки.
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

    // Добавляем марку к сету активных
    private openMark(mark: Mark) {
        this.marks = mark.addToSet(this.marks);
    }

    private closeMark(mark: MarkType) {
        this.marks = mark.removeFromSet(this.marks);
    }

    //#endregion

    private parseTokens(yfmTokens: Token[]) {
        for (let i = 0; i < yfmTokens.length; i++) {
            const yfmToken = yfmTokens[i];

            if (this.handlePrimitiveToken(yfmToken)) continue;

            const tokenSpec = this.getTokenSpec(yfmToken);

            if (tokenSpec.ignore) continue;

            const attrs = this.getTokenAttrs(yfmToken, tokenSpec, yfmTokens, i);

            this.handleToken(yfmToken, tokenSpec, attrs);
        }
    }
}

// Проверяет - если это две текстовые ноды и у них одинаковые марки то мерджит их в одну.
function maybeMerge(a: Node, b: Node) {
    if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) {
        // Почему-то этот метод не прописан в тайпингах, однако он существует.
        // @ts-expect-error
        return a.withText(a.text + b.text);
    }
}

function withoutTrailingNewline(str: string) {
    return str[str.length - 1] === '\n' || str.endsWith('\\n') ? str.slice(0, str.length - 1) : str;
}

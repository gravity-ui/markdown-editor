import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {type Node, Schema} from 'prosemirror-model';
import {
    schema as baseSchema,
    builders,
    code,
    doc,
    h1,
    br as hardBreak,
    p,
    pre,
    strong,
} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {Logger2} from '../../logger';
import type {Parser, ParserToken} from '../types/parser';

import {MarkdownParser, MarkdownParserDynamicModifier, type TokenAttrs} from './MarkdownParser';

const md = MarkdownIt('commonmark', {html: false, breaks: true});

const createTestParser = (
    schema: Schema,
    {
        dynamicModifier,
        tokens,
        tokenizer = md,
    }: {
        dynamicModifier?: MarkdownParserDynamicModifier;
        tokens?: Record<string, ParserToken>;
        tokenizer?: MarkdownIt;
    } = {},
): Parser =>
    new MarkdownParser(
        schema,
        tokenizer,
        {
            blockquote: {name: 'blockquote', type: 'block', ignore: true},
            paragraph: {type: 'block', name: 'paragraph'},
            softbreak: {type: 'node', name: 'hard_break'},
            ...tokens,
        },
        {
            logger: new Logger2().nested({env: 'test'}),
            pmTransformers: [],
            dynamicModifier,
        },
    );

function parseWith(parser: Parser) {
    return (text: string, node: Node) => {
        expect(parser.parse(text)).toMatchNode(node);
    };
}

describe('MarkdownParser', () => {
    const testParser = createTestParser(baseSchema);

    it('should ignore a blockquote', () => parseWith(testParser)('> hello!', doc(p('hello!'))));

    it('should convert softbreaks to hard_break nodes', () =>
        parseWith(testParser)('hello\nworld!', doc(p('hello', hardBreak(), 'world!'))));

    it('should preserve legacy mark placement around an inline node with content', () => {
        const schema = createInlineWrapperSchema();
        const {
            doc: wrapperDoc,
            p: wrapperParagraph,
            strong: wrapperStrong,
            wrapper,
        } = builders(schema, {
            p: {nodeType: 'paragraph'},
            wrapper: {nodeType: 'wrapper'},
        });
        const parser = createTestParser(schema, {
            tokens: {
                strong: {name: 'strong', type: 'mark'},
                link: {name: 'wrapper', type: 'block'},
            },
        });
        const tokens = md.parse('**before [inside](url) after**', {});

        expect(parser.parse(tokens)).toMatchNode(
            wrapperDoc(
                wrapperParagraph(
                    wrapperStrong('before '),
                    wrapper(wrapperStrong('inside')),
                    ' after',
                ),
            ),
        );
    });

    it('should preserve the outer document during a nested parse', () => {
        let parsingInner = false;
        const parser = createTestParser(baseSchema, {
            tokens: {
                paragraph: {
                    name: 'paragraph',
                    type: 'block',
                    getAttrs(token) {
                        if (token.type === 'paragraph_open' && !parsingInner) {
                            parsingInner = true;
                            expect(parser.parse('inner')).toMatchNode(doc(p('inner')));
                            parsingInner = false;
                        }
                        return {};
                    },
                },
            },
        });

        expect(parser.parse('outer')).toMatchNode(doc(p('outer')));
    });

    it('should isolate active marks during a nested parse', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                strong: {name: 'strong', type: 'mark'},
                hardbreak: {
                    name: 'hard_break',
                    type: 'node',
                    getAttrs() {
                        expect(parser.parse('inner')).toMatchNode(doc(p('inner')));
                        return {};
                    },
                },
            },
        });

        expect(parser.parse('**before\\\nafter**')).toMatchNode(
            doc(p(strong('before', hardBreak(), 'after'))),
        );
    });

    it('should start a clean parse after an unsupported token error', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {strong: {name: 'strong', type: 'mark'}},
        });
        const tokens = md.parse('**text**', {});
        getInlineTokens(tokens)[2].type = 'unknown_close';

        expect(() => parser.parse(tokens)).toThrow(/No token spec/);
        expect(parser.parse('plain')).toMatchNode(doc(p('plain')));
    });

    it('should preserve a literal backslash and n in Markdown text', () => {
        expect(testParser.parse('text\\n')).toMatchNode(doc(p('text\\n')));
    });

    it('should preserve a trailing newline in a text token', () => {
        const tokens = md.parse('text', {});
        getInlineTokens(tokens)[0].content = 'text\n';

        expect(testParser.parse(tokens)).toMatchNode(doc(p('text\n')));
    });

    it('should preserve a literal backslash and n in a standalone mark', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                code_inline: {name: 'strong', type: 'mark', noCloseToken: true},
            },
        });

        expect(parser.parse('`text\\n`')).toMatchNode(doc(p(strong('text\\n'))));
    });

    it('should preserve a trailing newline in a standalone code token', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                code_inline: {name: 'code', type: 'mark', noCloseToken: true, code: true},
            },
        });
        const tokens = md.parse('`text`', {});
        getInlineTokens(tokens)[0].content = 'text\n';

        expect(parser.parse(tokens)).toMatchNode(doc(p(code('text\n'))));
    });

    it('should normalize only a real newline in a standalone non-code token', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {code_inline: {name: 'strong', type: 'mark', noCloseToken: true}},
        });
        const tokens = md.parse('`text`', {});
        getInlineTokens(tokens)[0].content = 'text\\n\n';

        expect(parser.parse(tokens)).toMatchNode(doc(p(strong('text\\n'))));
    });

    it('should preserve a custom content preparation for standalone blocks', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                fence: {
                    name: 'code_block',
                    type: 'block',
                    noCloseToken: true,
                    prepareContent: (content) => content.slice(0, -1),
                },
            },
        });

        expect(parser.parse('```\ntext\\n\n```')).toMatchNode(doc(pre('text\\n')));
    });

    it('should pass the environment to Markdown plugins and expose their changes', () => {
        const tokenizer = new MarkdownIt('commonmark');
        const environment = {prefix: 'hello ', parsed: false};
        let receivedEnvironment: object | undefined;
        tokenizer.core.ruler.push('environment', (state) => {
            receivedEnvironment = state.env;
            const text = getInlineTokens(state.tokens)[0];
            const pluginEnvironment = state.env;
            text.content = pluginEnvironment.prefix + text.content;
            pluginEnvironment.parsed = true;
        });
        const parser = createTestParser(baseSchema, {tokenizer});

        expect(parser.parse('world', environment)).toMatchNode(doc(p('hello world')));
        expect(receivedEnvironment).toBe(environment);
        expect(environment.parsed).toBe(true);
    });

    it('should create a fresh default environment for each parse', () => {
        const tokenizer = new MarkdownIt('commonmark');
        tokenizer.core.ruler.push('environment', (state) => {
            const environment = state.env;
            if (environment.parsed) {
                getInlineTokens(state.tokens)[0].content = 'shared environment';
            }
            environment.parsed = true;
        });
        const parser = createTestParser(baseSchema, {tokenizer});

        expect(parser.parse('first')).toMatchNode(doc(p('first')));
        expect(parser.parse('second')).toMatchNode(doc(p('second')));
    });

    it('should read attributes only from the opening token', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                paragraph: {
                    name: 'paragraph',
                    type: 'block',
                    getAttrs(token) {
                        if (token.type !== 'paragraph_open') {
                            throw new Error('Expected an opening token');
                        }
                        return {};
                    },
                },
            },
        });

        expect(parser.parse('text')).toMatchNode(doc(p('text')));
    });

    it('should use schema defaults when getAttrs returns null', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                heading: {
                    name: 'heading',
                    type: 'block',
                    attrs: {level: 3},
                    // @ts-expect-error JavaScript extensions can return null at runtime.
                    getAttrs: () => null,
                },
            },
        });

        expect(parser.parse('# text')).toMatchNode(doc(h1('text')));
    });

    it('should use schema defaults with null attributes', () => {
        const parser = createTestParser(baseSchema, {
            tokens: {
                // @ts-expect-error JavaScript extensions can pass null at runtime.
                heading: {name: 'heading', type: 'block', attrs: null},
            },
        });

        expect(parser.parse('# text')).toMatchNode(doc(h1('text')));
    });

    it.each(['constructor', 'toString', 'unknown'])('should reject an unknown %s token', (name) => {
        const tokens = md.parse('text', {});
        getInlineTokens(tokens)[0].type = name;

        expect(() => testParser.parse(tokens)).toThrow(/No token spec/);
    });

    it.each(['constructor', 'toString'])(
        'should parse an explicitly registered %s token',
        (name) => {
            const parser = createTestParser(baseSchema, {
                tokens: {[name]: {name: 'hard_break', type: 'node'}},
            });
            const tokens = md.parse('text', {});
            getInlineTokens(tokens)[0].type = name;

            expect(parser.parse(tokens)).toMatchNode(doc(p(hardBreak())));
        },
    );

    it('should resolve a custom token through its pm-node alias', () => {
        const tokens = md.parse('text', {});
        const token = getInlineTokens(tokens)[0];
        token.type = 'custom';
        token.meta = {'pm-node': 'softbreak'};

        expect(testParser.parse(tokens)).toMatchNode(doc(p(hardBreak())));
    });
});

describe('MarkdownParser with MarkdownParserDynamicModifier', () => {
    it('should process tokens and set attributes using MarkdownParserDynamicModifier', () => {
        const extendedSchema = new Schema({
            nodes: baseSchema.spec.nodes.update('paragraph', {
                ...baseSchema.spec.nodes.get('paragraph'),
                attrs: {
                    ...baseSchema.spec.nodes.get('paragraph')?.attrs,
                    'data-some': {default: null},
                },
            }),
            marks: baseSchema.spec.marks,
        });

        const dynamicModifierConfig = {
            paragraph: {
                processToken: [
                    (token: Token) => {
                        token.attrSet('data-some', 'custom-attr');
                        return token;
                    },
                ],
                processNodeAttrs: [
                    (token: Token, attrs: TokenAttrs) => {
                        attrs['data-some'] = token.attrGet('data-some');
                        return attrs;
                    },
                ],
            },
        };

        const dynamicModifier = new MarkdownParserDynamicModifier(dynamicModifierConfig);

        const testParser = createTestParser(extendedSchema, {
            dynamicModifier,
            tokens: {
                paragraph: {
                    name: 'paragraph',
                    type: 'block',
                    // @ts-expect-error JavaScript extensions can return null at runtime.
                    getAttrs: () => null,
                },
            },
        });

        const {
            p: extendedParagraph,
            doc: extendedDoc,
            br: extendedBr,
        } = builders(extendedSchema, {
            p: {nodeType: 'paragraph'},
            doc: {nodeType: 'doc'},
            br: {nodeType: 'hard_break'},
        });

        const parsedNode = testParser.parse('hello\nworld!');
        expect(parsedNode).toBeDefined();

        const paragraphNode = parsedNode.content.firstChild!;
        expect(paragraphNode.attrs).toHaveProperty('data-some', 'custom-attr');

        parseWith(testParser)(
            'hello\nworld!',
            extendedDoc(
                extendedParagraph({'data-some': 'custom-attr'}, 'hello', extendedBr(), 'world!'),
            ),
        );
    });

    it('should preserve modifiers and child tokens of a marked standalone node', () => {
        const schema = createInlineWrapperSchema();
        const {
            doc: wrapperDoc,
            p: wrapperParagraph,
            strong: wrapperStrong,
            wrapper,
        } = builders(schema, {
            p: {nodeType: 'paragraph'},
            wrapper: {nodeType: 'wrapper'},
        });
        const dynamicModifier = new MarkdownParserDynamicModifier({
            image: {
                processToken: [
                    (token) => {
                        token.attrSet('label', 'token');
                        return token;
                    },
                ],
                processNodeAttrs: [(token, attrs) => ({...attrs, label: token.attrGet('label')})],
            },
            wrapper: {
                processNode: [
                    (node) =>
                        node.type.create(
                            {...node.attrs, label: node.attrs.label + ' node'},
                            node.content,
                            node.marks,
                        ),
                ],
            },
        });
        const parser = createTestParser(schema, {
            dynamicModifier,
            tokens: {
                strong: {name: 'strong', type: 'mark'},
                image: {
                    name: 'wrapper',
                    type: 'block',
                    noCloseToken: true,
                    contentField: 'children',
                },
            },
        });

        expect(parser.parse('**before ![inside](url) after**')).toMatchNode(
            wrapperDoc(
                wrapperParagraph(
                    wrapperStrong('before '),
                    wrapper({label: 'token node'}, wrapperStrong('inside')),
                    ' after',
                ),
            ),
        );
    });
});

function createInlineWrapperSchema() {
    return new Schema({
        nodes: baseSchema.spec.nodes.addToEnd('wrapper', {
            attrs: {label: {default: null}},
            content: 'text*',
            inline: true,
            group: 'inline',
        }),
        marks: baseSchema.spec.marks,
    });
}

function getInlineTokens(tokens: Token[]) {
    const inlineToken = tokens.find((token) => token.type === 'inline');
    if (!inlineToken?.children) {
        throw new Error('Expected inline tokens');
    }
    return inlineToken.children;
}

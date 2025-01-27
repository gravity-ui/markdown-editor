import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import {Node, Schema} from 'prosemirror-model';
import {schema as baseSchema, builders, doc, br as hardBreak, p} from 'prosemirror-test-builder';

import type {Parser} from '../types/parser';

import {MarkdownParser, MarkdownParserDynamicModifier, TokenAttrs} from './MarkdownParser';

const md = MarkdownIt('commonmark', {html: false, breaks: true});

const createTestParser = (
    schema: Schema,
    dynamicModifier?: MarkdownParserDynamicModifier,
): Parser =>
    new MarkdownParser(
        schema,
        md,
        {
            blockquote: {name: 'blockquote', type: 'block', ignore: true},
            paragraph: {type: 'block', name: 'paragraph'},
            softbreak: {type: 'node', name: 'hard_break'},
        },
        [],
        dynamicModifier,
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

        const dynamicModifier = new MarkdownParserDynamicModifier({
            tokensTypesFilter: ['paragraph_open'],
            tokensTypesProcesses: [
                (token: Token) => {
                    if (token.type === 'paragraph_open') {
                        token.attrSet('data-some', 'custom-attr');
                    }
                    return token;
                },
            ],
            attrsProcesses: [
                (token: Token, attrs: TokenAttrs) => {
                    if (token.type === 'paragraph_open') {
                        attrs['data-some'] = token.attrGet('data-some');
                    }
                    return attrs;
                },
            ],
        });

        const testParser = createTestParser(extendedSchema, dynamicModifier);

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
});

import MarkdownIt from 'markdown-it';
import type {Node} from 'prosemirror-model';
import {schema, doc, p, br as hardBreak} from 'prosemirror-test-builder';

import type {Parser} from '../types/parser';
import {MarkdownParser} from './MarkdownParser';

const md = MarkdownIt('commonmark', {html: false, breaks: true});
const testParser: Parser = new MarkdownParser(schema, md, {
    blockquote: {name: 'blockquote', type: 'block', ignore: true},
    paragraph: {type: 'block', name: 'paragraph'},
    softbreak: {type: 'node', name: 'hard_break'},
});

function parseWith(parser: Parser) {
    return (text: string, node: Node) => {
        expect(parser.parse(text)).toMatchNode(node);
    };
}

describe('MarkdownParser', () => {
    it('should ignore a blockquote', () => parseWith(testParser)('> hello!', doc(p('hello!'))));

    it('should convert softbreaks to hard_break nodes', () =>
        parseWith(testParser)('hello\nworld!', doc(p('hello', hardBreak(), 'world!'))));
});

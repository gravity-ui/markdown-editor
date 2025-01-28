/**
 * @jest-environment jsdom
 */

import MarkdownIt from 'markdown-it';
import {Schema} from 'prosemirror-model';
import * as builder from 'prosemirror-test-builder';
import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../tests/sameMarkup';
import type {Parser} from '../types/parser';
import type {SerializerNodeToken} from '../types/serializer';

import {MarkdownParser} from './MarkdownParser';
import {MarkdownSerializer} from './MarkdownSerializer';

const {schema} = builder;

const extendedSchema = new Schema({
    nodes: schema.spec.nodes.update('hard_break', {
        ...schema.spec.nodes.get('hard_break'),
        isBreak: true,
    }),
    marks: schema.spec.marks,
});

const parser: Parser = new MarkdownParser(
    extendedSchema,
    new MarkdownIt('commonmark'),
    {
        paragraph: {type: 'block', name: 'paragraph'},
        heading: {
            type: 'block',
            name: 'heading',
            getAttrs: (tok) => ({level: Number(tok.tag.slice(1))}),
        },
        list_item: {type: 'block', name: 'list_item'},
        bullet_list: {type: 'block', name: 'bullet_list'},
        ordered_list: {type: 'block', name: 'ordered_list'},
        hardbreak: {type: 'node', name: 'hard_break'},
        fence: {type: 'block', name: 'code_block', noCloseToken: true},

        em: {type: 'mark', name: 'em'},
        strong: {type: 'mark', name: 'strong'},
        code_inline: {type: 'mark', name: 'code', noCloseToken: true},
    },
    [],
);
const serializer = new MarkdownSerializer(
    {
        text: ((state, node) => {
            state.text(node.text);
        }) as SerializerNodeToken,
        paragraph: ((state, node) => {
            state.renderInline(node);
            state.closeBlock(node);
        }) as SerializerNodeToken,
        heading: ((state, node) => {
            state.write(state.repeat('#', node.attrs.level) + ' ');
            state.renderInline(node);
            state.closeBlock(node);
        }) as SerializerNodeToken,
        list_item: ((state, node) => {
            state.renderContent(node);
        }) as SerializerNodeToken,
        bullet_list: ((state, node) => {
            state.renderList(node, '  ', () => '* ');
        }) as SerializerNodeToken,
        ordered_list: ((state, node) => {
            const start = node.attrs.order || 1;
            const maxW = String(start + node.childCount - 1).length;
            const space = state.repeat(' ', maxW + 2);
            state.renderList(node, space, (i: number) => {
                const nStr = String(start + i);
                return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
            });
        }) as SerializerNodeToken,
        hard_break: ((state, node, parent, index) => {
            for (let i = index + 1; i < parent.childCount; i++)
                if (parent.child(i).type !== node.type) {
                    state.write('\\\n');
                    return;
                }
        }) as SerializerNodeToken,
        code_block: ((state, node) => {
            state.write('```\n');
            state.text(node.textContent, false);
            state.ensureNewLine();
            state.write('```');
            state.closeBlock(node);
        }) as SerializerNodeToken,
    },
    {
        em: {open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true},
        strong: {open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true},
        code: {open: '`', close: '`', escape: false, expelEnclosingWhitespace: true},
    },
);

const {doc, p, h1, h2, li, ul, ol, br} = builders(extendedSchema, {
    doc: {nodeType: 'doc'},
    p: {nodeType: 'paragraph'},
    h1: {nodeType: 'heading', level: 1},
    h2: {nodeType: 'heading', level: 2},
    li: {nodeType: 'list_item'},
    ul: {nodeType: 'bullet_list'},
    ol: {nodeType: 'ordered_list'},
    br: {nodeType: 'hard_break'},
});

const {em, strong, code} = builders(extendedSchema, {
    em: {markType: 'em'},
    strong: {markType: 'strong'},
    code: {markType: 'code'},
});

const {same, serialize} = createMarkupChecker({parser, serializer});

describe('MarkdownSerializer', () => {
    it('serializes a paragraph', () => same('hello!', doc(p('hello!'))));

    it('serializes headings', () => {
        same('# one\n\n## two\n\nthree', doc(h1('one'), h2('two'), p('three')));
    });

    it('serializes a bullet list', () =>
        same(
            '* foo\n\n  * bar\n\n  * baz\n\n* quux',
            doc(ul(li(p('foo'), ul(li(p('bar')), li(p('baz')))), li(p('quux')))),
        ));

    it('serializes an ordered list', () =>
        same(
            '1. Hello\n\n2. Goodbye\n\n3. Nest\n\n   1. Hey\n\n   2. Aye',
            doc(
                ol(li(p('Hello')), li(p('Goodbye')), li(p('Nest'), ol(li(p('Hey')), li(p('Aye'))))),
            ),
        ));

    it('serializes inline marks', () =>
        same(
            'Hello. Some *em* text, some **strong** text, and some `code`',
            doc(
                p(
                    'Hello. Some ',
                    em('em'),
                    ' text, some ',
                    strong('strong'),
                    ' text, and some ',
                    code('code'),
                ),
            ),
        ));

    it('serializes a line break', () =>
        same('line one\\\nline two', doc(p('line one', br(), 'line two'))));

    it('escapes special characters in a text', () => {
        same(
            'Markdown special characters: \\_underscore\\_, \\*asterisk\\*, \\`backtick\\`, \\$dollar\\$, \\{curly\\} brace, \\[square\\] bracket, and a \\|vertical\\| bar.',
            doc(
                p(
                    'Markdown special characters: _underscore_, *asterisk*, `backtick`, $dollar$, {curly} brace, [square] bracket, and a |vertical| bar.',
                ),
            ),
        );
    });

    it('expels enclosing whitespace from inside emphasis', () => {
        serialize(
            doc(
                p(
                    'Some emphasized text with',
                    strong(em('  whitespace   ')),
                    'surrounding the emphasis.',
                ),
            ),
            'Some emphasized text with  ***whitespace***   surrounding the emphasis.',
        );
    });
});

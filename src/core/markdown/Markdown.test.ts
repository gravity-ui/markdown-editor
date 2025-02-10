/**
 * @jest-environment jsdom
 */

import MarkdownIt from 'markdown-it';
import * as builder from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../tests/sameMarkup';
import type {Parser} from '../types/parser';
import type {SerializerNodeToken} from '../types/serializer';

import {MarkdownParser} from './MarkdownParser';
import {MarkdownSerializer} from './MarkdownSerializer';

const {schema} = builder;
schema.nodes['hard_break'].spec.isBreak = true;
const parser: Parser = new MarkdownParser(
    schema,
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

const {doc, p, h1, h2, li, ul, ol, br, pre} = builder;
const {em, strong, code} = builder;

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

describe('markdown', () => {
    it('parses a paragraph', () => same('hello!', doc(p('hello!')))); // TODO: move test to extensions?

    it('parses headings', () => {
        same('# one\n\n## two\n\nthree', doc(h1('one'), h2('two'), p('three'))); // TODO: move test to extensions?
    });

    // FIXME bring back testing for preserving bullets and tight attrs
    // when supported again

    it('parses a bullet list', () =>
        same(
            '* foo\n\n  * bar\n\n  * baz\n\n* quux',
            doc(ul(li(p('foo'), ul(li(p('bar')), li(p('baz')))), li(p('quux')))),
        ));

    it('parses an ordered list', () =>
        same(
            '1. Hello\n\n2. Goodbye\n\n3. Nest\n\n   1. Hey\n\n   2. Aye',
            doc(
                ol(li(p('Hello')), li(p('Goodbye')), li(p('Nest'), ol(li(p('Hey')), li(p('Aye'))))),
            ),
        ));

    it('parses inline marks', () =>
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

    it('parses overlapping inline marks', () =>
        same(
            'This is **strong *emphasized text with `code` in* it**',
            doc(
                p(
                    'This is ',
                    strong('strong ', em('emphasized text with ', code('code'), ' in'), ' it'),
                ),
            ),
        ));

    it('parses code mark inside strong text', () =>
        same('**`code` is bold**', doc(p(strong(code('code'), ' is bold')))));

    // tood
    it.skip('parses code mark containing backticks', () =>
        same(
            '``` one backtick: ` two backticks: `` ```',
            doc(p(code('one backtick: ` two backticks: ``'))),
        ));

    // todo
    it.skip('parses code mark containing only whitespace', () =>
        serialize(doc(p('Three spaces: ', code('   '))), 'Three spaces: `   `'));

    it('parses a line break', () =>
        same('line one\\\nline two', doc(p('line one', br(), 'line two'))));

    it('ignores HTML tags', () => parse('Foo < img> bar', doc(p('Foo < img> bar'))));

    it("doesn't accidentally generate list markup", () => same('1\\. foo', doc(p('1. foo'))));

    it("doesn't fail with line break inside inline mark", () =>
        same('**text1\ntext2**', doc(p(strong('text1\ntext2')))));

    it('drops trailing hard breaks', () => serialize(doc(p('a', br(), br())), 'a'));

    it('should remove marks from edge break (before)', () =>
        serialize(doc(p('text', strong(br(), 'text2'))), 'text\\\n**text2**'));

    it('should remove marks from edge break (after)', () =>
        serialize(doc(p(strong('text', br()), 'text2')), '**text**\\\ntext2'));

    it('expels enclosing whitespace from inside emphasis', () =>
        serialize(
            doc(
                p(
                    'Some emphasized text with',
                    strong(em('  whitespace   ')),
                    'surrounding the emphasis.',
                ),
            ),
            'Some emphasized text with  ***whitespace***   surrounding the emphasis.',
        ));

    it('drops nodes when all whitespace is expelled from them', () =>
        serialize(
            doc(p('Text with', em(' '), 'an emphasized space')),
            'Text with an emphasized space',
        ));

    it('preserves list tightness', () => {
        same('* foo\n\n* bar', doc(ul(li(p('foo')), li(p('bar')))));
        same('1. foo\n\n2. bar', doc(ol(li(p('foo')), li(p('bar')))));
    });

    it("doesn't put a code block after a list item inside the list item", () =>
        same('* list item\n\n```\ncode\n```', doc(ul(li(p('list item'))), pre('code\n'))));

    it("doesn't escape characters in code", () => same('foo`*`', doc(p('foo', code('*')))));

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
});

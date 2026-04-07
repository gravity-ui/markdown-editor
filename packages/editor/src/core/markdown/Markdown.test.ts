/**
 * @jest-environment jsdom
 */

import MarkdownIt from 'markdown-it';
import * as builder from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../tests/sameMarkup';
import {Logger2} from '../../logger';
import type {Parser} from '../types/parser';
import type {SerializerNodeToken} from '../types/serializer';

import {MarkdownParser} from './MarkdownParser';
import {MarkdownSerializer, MarkdownSerializerState} from './MarkdownSerializer';

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
    {logger: new Logger2().nested({env: 'test'}), pmTransformers: []},
);
const serializer = new MarkdownSerializer(
    {
        text: ((state, node) => {
            state.text(node.text ?? '');
        }) as SerializerNodeToken,
        paragraph: ((state, node) => {
            state.renderInline(node);
            state.closeBlock(node);
        }) as SerializerNodeToken,
        heading: ((state, node) => {
            state.write(state.repeat('#', node.attrs.level) + ' ');
            state.renderInline(node, false);
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

// Tests ported from prosemirror-markdown
describe('markdown (from prosemirror-markdown)', () => {
    it('parses a paragraph', () => same('hello!', doc(p('hello!'))));

    it('parses headings', () => {
        same('# one\n\n## two\n\nthree', doc(h1('one'), h2('two'), p('three')));
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

    // todo: parser adds empty paragraph before heading in list_item
    it.skip('can parse a heading in a list', () => same('* # Foo', doc(ul(li(h1('Foo'))))));

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

    // todo: requires dynamic backtick fencing in code mark serializer
    it.skip('parses code mark containing backticks', () =>
        same(
            '``` one backtick: ` two backticks: `` ```',
            doc(p(code('one backtick: ` two backticks: ``'))),
        ));

    // todo: requires code mark to preserve whitespace-only content
    it.skip('parses code mark containing only whitespace', () =>
        serialize(doc(p('Three spaces: ', code('   '))), 'Three spaces: `   `'));

    it('parses hard breaks', () => {
        same('line one\\\nline two', doc(p('line one', br(), 'line two')));
    });

    it('parses hard breaks inside emphasis', () =>
        same('*foo\\\nbar*', doc(p(em('foo', br(), 'bar')))));

    it('ignores HTML tags', () => parse('Foo < img> bar', doc(p('Foo < img> bar'))));

    it("doesn't accidentally generate list markup", () => same('1\\. foo', doc(p('1. foo'))));

    it("doesn't fail with line break inside inline mark", () =>
        same('**text1\ntext2**', doc(p(strong('text1\ntext2')))));

    it('drops trailing hard breaks', () => serialize(doc(p('a', br(), br())), 'a'));

    it('properly expels whitespace before a hard break', () =>
        serialize(doc(p(strong('foo ', br()), 'bar')), '**foo** \\\nbar'));

    it("doesn't crash when a block ends in a hard break", () =>
        serialize(doc(p(strong('foo', br()))), '**foo**'));

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

    // todo: requires smarter startOfLine escape – don't escape `\d+.` without trailing space
    it.skip('does not escape list markers without space after them', () =>
        same('1.2kg', doc(p('1.2kg'))));

    // todo: requires removing `+` from defaultEsc in esc()
    it.skip("doesn't escape +++", () => same('+++', doc(p('+++'))));

    it('escapes list markers inside lists', () => {
        same('* 1\\. hi\n\n* x', doc(ul(li(p('1. hi')), li(p('x')))));
    });

    it("doesn't escape block-start characters in heading content", () => {
        same('# 1. foo', doc(h1('1. foo')));
    });

    it('escapes ATX heading markers with space after them', () => {
        same('\\### text', doc(p('### text')));
    });

    it('escapes ATX heading markers followed by end of line', () => {
        same('\\###', doc(p('###')));
    });

    // todo: requires smarter startOfLine escape for # – only escape #{1,6} followed by space or EOL
    it.skip('does not escape ATX heading markers without space after them', () => {
        same('#hashtag', doc(p('#hashtag')));
    });

    // todo: requires smarter startOfLine escape for # – only escape #{1,6} followed by space or EOL
    it.skip('does not escape ATX heading markers consisting of more than 6 in a sequence', () => {
        same('#######', doc(p('#######')));
    });
});

// Tests specific to the fork's extensions and customizations
describe('markdown (fork-specific)', () => {
    it('should remove marks from edge break (before)', () =>
        serialize(doc(p('text', strong(br(), 'text2'))), 'text\\\n**text2**'));

    it('should remove marks from edge break (after)', () =>
        serialize(doc(p(strong('text', br()), 'text2')), '**text**\\\ntext2'));

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

    it('escapes exclamation mark before image syntax', () => {
        same('hello !\\[alt\\](path/to/image)', doc(p('hello ![alt](path/to/image)')));
    });

    it('escapes exclamation mark before non-escaped bracket in text()', () => {
        // Directly tests the fix: when text() is called with escape=false
        // and content starts with [, a preceding ! must become \!
        const state = new MarkdownSerializerState({}, {}, {});
        state.out = 'hello!';
        state.text('[link](url)', false);
        expect(state.out).toBe('hello\\![link](url)');
    });

    it('does not escape underscore between word characters', () => {
        same('foo_bar', doc(p('foo_bar')));
        same('a_b_c', doc(p('a_b_c')));
    });

    it('escapes underscore at word boundaries', () => {
        same('\\_leading', doc(p('_leading')));
        same('trailing\\_', doc(p('trailing_')));
        same('space \\_ space', doc(p('space _ space')));
    });

    describe('expelEnclosingWhitespace with mark continuation', () => {
        it('keeps trailing whitespace inside mark when mark continues', () => {
            // strong("hello ") + strong(em("world")) — strong continues
            // trailing space stays inside strong, before em opens
            serialize(doc(p(strong('hello '), strong(em('world')))), '**hello *world***');
        });

        it('expels trailing whitespace when mark does not continue', () => {
            serialize(doc(p(strong('hello '), 'world')), '**hello** world');
        });

        it('keeps leading whitespace inside mark when mark is already active', () => {
            // em("hello") + em(code("x")) + em(" world") — em continues throughout
            // leading space in " world" stays inside em
            serialize(doc(p(em('hello'), em(code('x')), em(' world'))), '*hello`x` world*');
        });

        it('expels leading whitespace when mark is opening', () => {
            serialize(doc(p('before', strong(' hello'))), 'before **hello**');
        });
    });

    describe('atBlockStart – startOfLine escaping precision', () => {
        it('does not escape # after line break inside inline content', () => {
            serialize(doc(p(strong('text1\n#text2'))), '**text1\n#text2**');
        });

        it('does not escape - after line break inside inline content', () => {
            serialize(doc(p(strong('line1\n-line2'))), '**line1\n-line2**');
        });

        // todo: > is in defaultEsc so it's always escaped, not just at startOfLine; needs esc() change
        it.skip('does not escape > after line break inside inline content', () => {
            serialize(doc(p(strong('line1\n>quote'))), '**line1\n>quote**');
        });

        it('does not escape numbered list after line break inside inline content', () => {
            serialize(doc(p(strong('line1\n1. item'))), '**line1\n1. item**');
        });

        it('still escapes # at actual block start', () => {
            same('\\# not a heading', doc(p('# not a heading')));
        });

        it('still escapes - at actual block start', () => {
            same('\\- not a list', doc(p('- not a list')));
        });

        it('still escapes > at actual block start', () => {
            same('\\>not a quote', doc(p('>not a quote')));
        });

        it('still escapes numbered list at actual block start', () => {
            same('1\\. not a list', doc(p('1. not a list')));
        });
    });

    describe('render (strict mode for nodes)', () => {
        const nodeStrictSerializer = new MarkdownSerializer(
            {
                text: ((state, node) => {
                    state.text(node.text ?? '');
                }) as SerializerNodeToken,
                paragraph: ((state, node) => {
                    state.renderInline(node);
                    state.closeBlock(node);
                }) as SerializerNodeToken,
                // 'heading' is NOT registered
            },
            {
                em: {open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true},
                strong: {open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true},
            },
        );

        it('throws on unknown node in strict mode (default)', () => {
            expect(() => nodeStrictSerializer.serialize(doc(h1('text')))).toThrow(
                /Token type `heading` not supported by Markdown renderer/,
            );
        });

        it('renders inline content of unknown node in non-strict mode', () => {
            expect(nodeStrictSerializer.serialize(doc(h1('text')), {strict: false})).toBe('text');
        });

        it('renders inline content with marks of unknown node in non-strict mode', () => {
            expect(
                nodeStrictSerializer.serialize(doc(h1('hello ', strong('world'))), {strict: false}),
            ).toBe('hello **world**');
        });
    });

    describe('getMark (strict mode)', () => {
        const strictSerializer = new MarkdownSerializer(
            {
                text: ((state, node) => {
                    state.text(node.text ?? '');
                }) as SerializerNodeToken,
                paragraph: ((state, node) => {
                    state.renderInline(node);
                    state.closeBlock(node);
                }) as SerializerNodeToken,
            },
            {
                // only 'strong' is registered, 'em' and 'code' are missing
                strong: {open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true},
            },
        );

        it('throws on unknown mark in strict mode (default)', () => {
            expect(() => strictSerializer.serialize(doc(p(em('text'))))).toThrow(
                /Mark type `em` not supported by Markdown renderer/,
            );
        });

        it('silently ignores unknown mark in non-strict mode', () => {
            expect(strictSerializer.serialize(doc(p(em('text'))), {strict: false})).toBe('text');
        });

        it('serializes known marks normally in non-strict mode', () => {
            expect(strictSerializer.serialize(doc(p(strong('text'))), {strict: false})).toBe(
                '**text**',
            );
        });

        it('silently ignores unknown mark mixed with known marks in non-strict mode', () => {
            expect(strictSerializer.serialize(doc(p(strong(em('text')))), {strict: false})).toBe(
                '**text**',
            );
        });
    });

    describe('document-level cache', () => {
        let renderTopLevelContentCallCount: number;
        const origRenderTopLevelContent = MarkdownSerializerState.prototype.renderTopLevelContent;

        beforeEach(() => {
            serializer.clearCache();
            renderTopLevelContentCallCount = 0;
            MarkdownSerializerState.prototype.renderTopLevelContent = function (parent) {
                renderTopLevelContentCallCount++;
                return origRenderTopLevelContent.call(this, parent);
            };
        });

        afterEach(() => {
            MarkdownSerializerState.prototype.renderTopLevelContent = origRenderTopLevelContent;
            serializer.clearCache();
        });

        it('returns cached result for the same doc node', () => {
            const document = doc(p('hello'));
            const result1 = serializer.serialize(document);
            renderTopLevelContentCallCount = 0;
            const result2 = serializer.serialize(document);
            expect(result2).toBe('hello');
            expect(result2).toBe(result1);
            expect(renderTopLevelContentCallCount).toBe(0);
        });

        it('re-serializes when doc node changes', () => {
            const doc1 = doc(p('hello'));
            const doc2 = doc(p('world'));
            const result1 = serializer.serialize(doc1);
            const result2 = serializer.serialize(doc2);
            expect(result1).toBe('hello');
            expect(result2).toBe('world');
        });

        it('cache hit when options objects differ by reference but equal by content', () => {
            const document = doc(p('hello'));
            serializer.serialize(document, {tightLists: true});
            renderTopLevelContentCallCount = 0;
            const result = serializer.serialize(document, {tightLists: true});
            expect(result).toBe('hello');
            expect(renderTopLevelContentCallCount).toBe(0);
        });

        it('cache miss when options actually differ', () => {
            const document = doc(p('hello'));
            serializer.serialize(document, {strict: true});
            renderTopLevelContentCallCount = 0;
            serializer.serialize(document, {strict: false});
            expect(renderTopLevelContentCallCount).toBeGreaterThan(0);
        });

        it('cache hit when RegExp options are equal but different objects', () => {
            const document = doc(p('hello'));
            serializer.serialize(document, {commonEscape: /[abc]/g});
            renderTopLevelContentCallCount = 0;
            serializer.serialize(document, {commonEscape: /[abc]/g});
            expect(renderTopLevelContentCallCount).toBe(0);
        });

        it('cache miss when RegExp options differ', () => {
            const document = doc(p('hello'));
            serializer.serialize(document, {commonEscape: /[abc]/g});
            renderTopLevelContentCallCount = 0;
            serializer.serialize(document, {commonEscape: /[xyz]/g});
            expect(renderTopLevelContentCallCount).toBeGreaterThan(0);
        });

        it('clearCache forces re-serialization', () => {
            const document = doc(p('hello'));
            serializer.serialize(document);
            serializer.clearCache();
            renderTopLevelContentCallCount = 0;
            serializer.serialize(document);
            expect(renderTopLevelContentCallCount).toBeGreaterThan(0);
        });

        it('cache hit with same options reference (fast path)', () => {
            const document = doc(p('hello'));
            const opts = {tightLists: true, commonEscape: /test/g};
            serializer.serialize(document, opts);
            renderTopLevelContentCallCount = 0;
            serializer.serialize(document, opts);
            expect(renderTopLevelContentCallCount).toBe(0);
        });
    });

    describe('top-level node cache', () => {
        let renderCallCount: number;
        let renderedNodeTypes: string[];
        const origRender = MarkdownSerializerState.prototype.render;

        beforeEach(() => {
            serializer.clearCache();
            renderCallCount = 0;
            renderedNodeTypes = [];
            MarkdownSerializerState.prototype.render = function (node, parent, index) {
                renderCallCount++;
                renderedNodeTypes.push(node.type.name);
                return origRender.call(this, node, parent, index);
            };
        });

        afterEach(() => {
            MarkdownSerializerState.prototype.render = origRender;
            serializer.clearCache();
        });

        it('uses cache for unchanged blocks when one block changes', () => {
            const block1 = p('hello');
            const block2 = p('world');
            serializer.serialize(doc(block1, block2));

            // Change only block2 — block1 should come from cache
            const block2new = p('changed');
            renderCallCount = 0;
            renderedNodeTypes = [];
            const result = serializer.serialize(doc(block1, block2new));

            expect(result).toBe('hello\n\nchanged');
            // Only block2new is re-rendered (paragraph + its inline text child)
            expect(renderedNodeTypes).toStrictEqual(['paragraph', 'text']);
        });

        it('produces correct separators between blocks on cache hit', () => {
            const block1 = p('one');
            const block2 = p('two');
            const block3 = p('three');
            serializer.serialize(doc(block1, block2, block3));

            // New doc with same blocks — document-level miss, top-level cache hit
            renderCallCount = 0;
            const result = serializer.serialize(doc(block1, block2, block3));
            expect(result).toBe('one\n\ntwo\n\nthree');
            // All blocks from top-level cache, none re-rendered
            expect(renderCallCount).toBe(0);
        });

        it('correct separator for two consecutive lists of the same type', () => {
            const list1 = ul(li(p('a')));
            const list2 = ul(li(p('b')));
            const result = serializer.serialize(doc(list1, list2));
            expect(result).toBe('* a\n\n\n* b');

            // New doc, same blocks — top-level cache hit
            const result2 = serializer.serialize(doc(list1, list2));
            expect(result2).toBe('* a\n\n\n* b');
        });

        it('handles mixed block types correctly', () => {
            const heading = h1('Title');
            const paragraph = p('text');
            const list = ul(li(p('item')));
            const codeBlock = pre('code\n');
            serializer.serialize(doc(heading, paragraph, list, codeBlock));

            // Change only the paragraph, others from cache
            const newParagraph = p('new text');
            renderCallCount = 0;
            renderedNodeTypes = [];
            const result = serializer.serialize(doc(heading, newParagraph, list, codeBlock));

            expect(result).toBe('# Title\n\nnew text\n\n* item\n\n```\ncode\n```');
            // Only newParagraph is re-rendered (paragraph + its inline text child)
            expect(renderedNodeTypes).toStrictEqual(['paragraph', 'text']);
        });

        it('invalidates cache when block order changes (prevClosedTypeName differs)', () => {
            const heading = h1('Title');
            const paragraph = p('text');
            serializer.serialize(doc(heading, paragraph));

            // Swap order — prevClosedTypeName changes for both blocks
            renderCallCount = 0;
            const result = serializer.serialize(doc(paragraph, heading));

            expect(result).toBe('text\n\n# Title');
            expect(renderCallCount).toBeGreaterThanOrEqual(2);
        });

        it('clearCache resets top-level node cache', () => {
            const block = p('hello');
            serializer.serialize(doc(block));

            serializer.clearCache();
            renderCallCount = 0;
            serializer.serialize(doc(block));
            expect(renderCallCount).toBeGreaterThan(0);
        });

        it('invalidates top-level node cache when options change', () => {
            const block = p('hello');
            serializer.serialize(doc(block), {strict: true});

            renderCallCount = 0;
            serializer.serialize(doc(block), {strict: false});
            expect(renderCallCount).toBeGreaterThan(0);
        });

        it('does not cache nested nodes (non top-level)', () => {
            // paragraph is nested inside list_item — it should not be cached
            const paragraph = p('nested');
            const list1 = ul(li(paragraph));
            serializer.serialize(doc(list1));

            // New list with the same paragraph node inside — list is new,
            // so top-level cache misses. The nested paragraph must be
            // re-rendered, not taken from cache.
            const list2 = ul(li(paragraph));
            renderCallCount = 0;
            renderedNodeTypes = [];
            const result = serializer.serialize(doc(list2));

            expect(result).toBe('* nested');
            // paragraph and text must be re-rendered (not cached)
            expect(renderedNodeTypes).toContain('paragraph');
            expect(renderedNodeTypes).toContain('text');
        });
    });
});

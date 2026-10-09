import {Schema} from 'prosemirror-model';
import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {BaseSchemaSpecs} from '../../extensions/base/specs';
import {BoldSpecs} from '../../extensions/markdown/Bold/BoldSpecs';
import {BreaksSpecs} from '../../extensions/markdown/Breaks/BreaksSpecs';
import {CodeSpecs} from '../../extensions/markdown/Code/CodeSpecs';
import {HeadingSpecs} from '../../extensions/markdown/Heading/HeadingSpecs';
import {ImageSpecs} from '../../extensions/markdown/Image/ImageSpecs';
import {ItalicSpecs} from '../../extensions/markdown/Italic/ItalicSpecs';
import {LinkSpecs} from '../../extensions/markdown/Link/LinkSpecs';
import {Logger2} from '../../logger';
import {ExtensionsManager} from '../ExtensionsManager';

import {MarkdownParser} from './MarkdownParser';
import type {SerializerMarkToken} from './MarkdownSerializer';

// Known failures are tracked in MDEDITOR-1494.
describe('MarkdownSerializer whitespace research', () => {
    describe('em ordered before strong', () => {
        const {doc, p, em, strong, code, a, img, h1, br, sb, parser, serializer} = createFixture();
        it('should preserve emphasis on links before expelled whitespace', () => {
            const text = serializer.serialize(doc(p(em(a('x')), em(strong(' ')), a('y'))));
            expect(text).toBe('*[x ](foo)*[y](foo)');
            expect(parser.parse(text)).toMatchNode(doc(p(em(a('x ')), a('y'))));
        });

        it('should keep expelled whitespace inside an active link', () => {
            const text = serializer.serialize(doc(p('x', a(' '), em(a(' ')), 'y')));
            expect(text).toBe('x[  ](foo)y');
            expect(parser.parse(text)).toMatchNode(doc(p('x', a('  '), 'y')));
        });

        it('should keep code whitespace before an expelled whitespace node', () => {
            const text = serializer.serialize(doc(p(em('x'), em(code(' ')), em(' '), 'y')));
            expect(text).toBe('*x` `* y');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x', code(' ')), ' y')));
        });

        it('should expel code-only whitespace before closing linked emphasis', () => {
            const text = serializer.serialize(doc(p(em('x', a(' '), a(code(' '))), 'y')));
            expect(text).toBe('*x[ ](foo)* y');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x', a(' ')), ' y')));
        });

        it('should expel link whitespace after code before closing emphasis', () => {
            const text = serializer.serialize(doc(p(em('x', a(code(' ')), a(' ')), 'y')));
            expect(text).toBe('*x[` `](foo)* y');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x', a(code(' '))), ' y')));
        });

        it('should close emphasis before trailing code whitespace', () => {
            const text = serializer.serialize(doc(p(em(code('x ')), strong(code(' ')))));
            expect(text).toBe('*`x`*  ');
            expect(parser.parse(text)).toMatchNode(doc(p(em(code('x')))));
        });

        it('should keep expelled whitespace outside adjacent links', () => {
            const expectedDoc = doc(p(em(a('x'), '  ', a('y'))));
            const expectedMarkup = '*[x](foo)  [y](foo)*';
            expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        });

        it.fails('should keep emphasis around links with differently marked whitespace', () => {
            const text = serializer.serialize(
                doc(p(strong(em(a('x'))), em(a(' ')), strong(a(' ')), strong(em(code('y'))))),
            );
            expect(text).toBe('***[x  ](foo)`y`***');
            expect(parser.parse(text)).toMatchNode(doc(p(strong(em(a('x  '), code('y'))))));
        });

        it('should preserve image emphasis after reordered code whitespace', () => {
            const input = doc(p(strong(em(a('x'))), a(code(' ')), em(a(img({src: 'a'}))), a('y')));
            const text = serializer.serialize(input);
            expect(text).toBe('***[x](foo)***` `*[![x](a)](foo)*[y](foo)');
            expect(parser.parse(text)).toMatchNode(
                doc(p(strong(em(a('x'))), code(' '), em(a(img({src: 'a'}))), a('y'))),
            );
        });

        it('should keep deferred whitespace across an omitted linked node', () => {
            const text = serializer.serialize(
                doc(p(strong(em('x')), em(' '), em(strong(a(' '))), em('y'))),
            );
            expect(text).toBe('***x**  y*');
            expect(parser.parse(text)).toMatchNode(doc(p(em(strong('x'), '  y'))));
        });

        it.fails('should preserve nested emphasis across line separator whitespace', () => {
            const text = serializer.serialize(
                doc(p(em(strong('y')), em('\u2028'), em(strong('y')))),
            );
            expect(text).toBe('***y\u2028y***');
            expect(parser.parse(text)).toMatchNode(doc(p(em(strong('y\u2028y')))));
        });

        it.fails('should keep a leading code newline inside continuing emphasis', () => {
            const text = serializer.serialize(
                doc(p(em(strong(code('x'))), em(' '), em(strong(code('\ny'))))),
            );
            expect(text).toBe('***`x` `\ny`***');
            expect(parser.parse(text)).toMatchNode(doc(p(em(strong(code('x'), ' ', code(' y'))))));
        });

        it('should keep a heading on one line after expelling leading whitespace', () => {
            const text = serializer.serialize(doc(h1(strong(' y\n'), strong(em('x')))));
            expect(text).toBe('#  **y*x***');
            expect(parser.parse(text)).toMatchNode(doc(h1(strong('y', em('x')))));
        });

        it('should preserve trailing whitespace in multiline code', () => {
            const text = serializer.serialize(doc(p(em(code('x\ny ')))));
            expect(text).toBe('*`x\ny `*');
            expect(parser.parse(text)).toMatchNode(doc(p(em(code('x y ')))));
        });

        it('should preserve trailing whitespace in multiline links', () => {
            const text = serializer.serialize(doc(p(em(a('x\ny ')))));
            expect(text).toBe('*[x\ny ](foo)*');
            expect(parser.parse(text)).toMatchNode(doc(p(em(a('x', sb(), 'y ')))));
        });

        it('should expel a trailing line break outside an ending link', () => {
            const text = serializer.serialize(doc(p(strong(a('x\n')), em('y'))));
            expect(text).toBe('**[x](foo)**\n*y*');
            expect(parser.parse(text)).toMatchNode(doc(p(strong(a('x')), sb(), em('y'))));
        });

        it('should expel multiline emphasis whitespace after an ending link', () => {
            const text = serializer.serialize(doc(p(a('x'), em('y\nz '))));
            expect(text).toBe('[x](foo)*y\nz* ');
            expect(parser.parse(text)).toMatchNode(doc(p(a('x'), em('y', sb(), 'z'))));
        });

        it('should serialize long whitespace within continuing emphasis', () => {
            const space = ' '.repeat(100000);
            const expectedDoc = doc(p(em('x' + space + 'y', strong('z'))));
            const expectedMarkup = '*x' + space + 'y**z***';
            expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        });

        it('should expel whitespace before an unmarked hard break', () => {
            const text = serializer.serialize(doc(p(em('x '), br(), em('y'))));
            expect(text).toBe('*x* \\\n*y*');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x'), ' ', br(), em('y'))));
        });

        it('should expel whitespace from a non-escaping mark without delimiters', () => {
            const {serializer: customSerializer} = createFixture(undefined, {
                code: {open: '', close: '', escape: false},
            });
            const text = customSerializer.serialize(doc(p(em(code('x ')), 'y')));
            expect(text).toBe('*x* y');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x'), ' y')));
        });

        it('should keep link whitespace inside empty non-escaping delimiters', () => {
            const {serializer: customSerializer} = createFixture(undefined, {
                code: {open: () => '', close: () => '', escape: false},
            });
            const text = customSerializer.serialize(doc(p(em('x', a(code(' ')), 'y'))));
            expect(text).toBe('*x[ ](foo)y*');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x', a(' '), 'y'))));
        });

        it('should keep link whitespace when emphasis starts inside empty non-escaping delimiters', () => {
            const {serializer: customSerializer} = createFixture(undefined, {
                code: {open: () => '', close: () => '', escape: false},
            });
            const text = customSerializer.serialize(doc(p(a('x'), em(a(code(' '))), 'y')));
            expect(text).toBe('[x ](foo)y');
            expect(parser.parse(text)).toMatchNode(doc(p(a('x '), 'y')));
        });

        it('should preserve emphasis after reordered whitespace in empty non-escaping delimiters', () => {
            const {serializer: customSerializer} = createFixture(undefined, {
                code: {open: () => '', close: () => '', escape: false},
            });
            const text = customSerializer.serialize(
                doc(p(code('*'), em(strong(a(code('x')))), a(code(' ')), em(a('y')))),
            );
            expect(text).toBe('****[x](foo)*** *[y](foo)*');
            expect(parser.parse(text)).toMatchNode(
                doc(p('*', em(strong(a('x'))), ' ', em(a('y')))),
            );
        });
    });
    describe('custom strong delimiters', () => {
        const {doc, p, em, strong, a, sb, parser, serializer} = createFixture(undefined, {
            strong: {open: '__', close: '__', mixable: true, expelEnclosingWhitespace: true},
        });
        it('should preserve multiline text in continuing custom strong emphasis', () => {
            const text = serializer.serialize(
                doc(p(strong('x'), em(strong(a(' '))), em(strong(' ')), strong(a(' x\ny')))),
            );
            expect(text).toBe('__x  [ x\ny](foo)__');
            expect(parser.parse(text)).toMatchNode(doc(p(strong('x  ', a(' x', sb(), 'y')))));
        });

        it.fails(
            'should keep custom strong emphasis across linked line separator whitespace',
            () => {
                const text = serializer.serialize(
                    doc(p(em(strong('y')), em('\u2028'), em(strong(a('y'), 'z')))),
                );
                expect(text).toBe('*__y\u2028[y](foo)z__*');
                expect(parser.parse(text)).toMatchNode(doc(p(em(strong('y\u2028', a('y'), 'z')))));
            },
        );
    });
    describe('strong ordered before em', () => {
        const {doc, p, em, strong, a, code, parser, serializer} = createFixture([
            'strong',
            'em',
            'link',
            'code',
        ]);
        it('should close marks before expelled whitespace', () => {
            const text = serializer.serialize(doc(p(strong(em('x')), em(' '), 'y')));
            expect(text).toBe('***x*** y');
            expect(parser.parse(text)).toMatchNode(doc(p(strong(em('x')), ' y')));
        });

        it('should keep continuing emphasis across expelled whitespace', () => {
            const text = serializer.serialize(doc(p(em('x'), strong(' '), em('y'))));
            expect(text).toBe('*x y*');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x y'))));
        });

        it.fails('should keep continuing emphasis across multiple whitespace nodes', () => {
            const text = serializer.serialize(
                doc(p(em('x'), strong(em(' ')), strong(' '), strong(em('y')))),
            );
            expect(text).toBe('*x  **y***');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x  ', strong('y')))));
        });

        it.fails('should keep trailing line separator whitespace inside a continuing link', () => {
            const text = serializer.serialize(doc(p(a(' '), strong(a('x ')), em(a('\u2028')))));
            expect(text).toBe('[ **x \u2028**](foo)');
            expect(parser.parse(text)).toMatchNode(doc(p(a(' '), strong(a('x \u2028')))));
        });

        it.fails('should expel trailing whitespace before an expelled whitespace node', () => {
            const text = serializer.serialize(doc(p(strong('x '), strong(em(' ')), 'y')));
            expect(text).toBe('**x**  y');
            expect(parser.parse(text)).toMatchNode(doc(p(strong('x'), '  y')));
        });

        it('should preserve code whitespace across reordered emphasis', () => {
            const input = doc(p(em(code('x ')), em(' '), strong(em('y'))));
            const text = serializer.serialize(input);
            expect(text).toBe('*`x ` **y***');
            expect(parser.parse(text)).toMatchNode(input);
        });

        it('should close emphasis before wholly expelled code whitespace', () => {
            const text = serializer.serialize(doc(p(em('x'), strong(em(code(' '))))));
            expect(text).toBe('*x* ');
            expect(parser.parse(text)).toMatchNode(doc(p(em('x'))));
        });

        it.fails('should preserve linked emphasis after reordered code whitespace', () => {
            const text = serializer.serialize(
                doc(p(strong(em(a('!'))), a(code(' ')), strong(em(a('x '))), strong(a(' ')))),
            );
            expect(text).toBe('***[!](foo)***` `***[x ](foo)*** ');
            expect(parser.parse(text)).toMatchNode(
                doc(p(strong(em(a('!'))), code(' '), strong(em(a('x '))))),
            );
        });
    });
    describe('link ordered between em and strong', () => {
        const {doc, p, em, strong, a, code, parser, serializer} = createFixture([
            'em',
            'link',
            'strong',
            'code',
        ]);
        it('should close strong before whitespace in continuing emphasis', () => {
            const input = doc(p(em(strong('x'), ' ', strong(a('y')), 'z')));
            const text = serializer.serialize(input);
            expect(text).toBe('***x** [**y**](foo)z*');
            expect(parser.parse(text)).toMatchNode(input);
        });

        it('should preserve continuing strong inside a link after shared whitespace', () => {
            const input = doc(p(em('x', strong('x'), ' ', a(strong('y'))), a(strong(code('x')))));
            const text = serializer.serialize(input);
            expect(text).toBe('*x**x** [**y**](foo)*[**`x`**](foo)');
            expect(parser.parse(text)).toMatchNode(input);
        });
    });
    describe('link ordered between strong and em', () => {
        const {doc, p, em, strong, a, code, img, sb, parser, serializer} = createFixture([
            'strong',
            'link',
            'em',
            'code',
        ]);
        it('should keep expelled whitespace outside an enclosing link', () => {
            const input = doc(p(strong(a(em('x'))), strong(' '), strong(a('y'))));
            const text = serializer.serialize(input);
            expect(text).toBe('**[*x*](foo) [y](foo)**');
            expect(parser.parse(text)).toMatchNode(input);
        });

        it.fails('should preserve a continuing link after reordered emphasis', () => {
            const input = doc(
                p(strong(em('x')), strong(' '), strong(a(em(code('y')))), a(code('z'))),
            );
            const text = serializer.serialize(input);
            expect(text).toBe('***x [`y`](foo)***[`z`](foo)');
            expect(parser.parse(text)).toMatchNode(
                doc(p(strong(em('x ')), strong(a(em(code('y')))), a(code('z')))),
            );
        });

        it.fails('should keep emphasis inside a continuing link before unescaped text', () => {
            const text = serializer.serialize(
                doc(p(strong(em('x')), strong(' '), strong(a(em(code('y')))), strong(a('z')))),
            );
            expect(text).toBe('***x [`y`](foo)*[z](foo)**');
            expect(parser.parse(text)).toMatchNode(
                doc(p(strong(em('x ')), strong(a(em(code('y')))), strong(a('z')))),
            );
        });

        it('should preserve continuing emphasis inside a link after a line break', () => {
            const text = serializer.serialize(
                doc(p(strong('x', em('x'), '\n', a(em('x'))), a(em('y')))),
            );
            expect(text).toBe('**x*x*\n[*x*](foo)**[*y*](foo)');
            expect(parser.parse(text)).toMatchNode(
                doc(p(strong('x', em('x'), sb(), a(em('x'))), a(em('y')))),
            );
        });

        it.fails(
            'should close linked emphasis before deferred whitespace and code whitespace',
            () => {
                const text = serializer.serialize(
                    doc(p(strong(a(em('x'))), em('\t'), em(code(' ')), strong(a(em('x'))))),
                );
                expect(text).toBe('**[*x*](foo)**\t` `**[*x*](foo)**');
                expect(parser.parse(text)).toMatchNode(
                    doc(p(strong(a(em('x'))), '\t', code(' '), strong(a(em('x'))))),
                );
            },
        );

        it('should keep leading code whitespace inside a continuing linked emphasis', () => {
            const input = doc(p(em('x '), a(em(code(' y')))));
            const text = serializer.serialize(input);
            expect(text).toBe('*x [` y`](foo)*');
            expect(parser.parse(text)).toMatchNode(input);
        });

        it.fails('should preserve multiline linked text after reordered code whitespace', () => {
            const text = serializer.serialize(
                doc(
                    p(
                        strong(a(em(code('https://example.com')))),
                        em(code('\t')),
                        strong(a(em('\tx\ny'))),
                    ),
                ),
            );
            expect(text).toBe('**[*`https://example.com`*](foo)**`\t`\t**[*x\ny*](foo)**');
            expect(parser.parse(text)).toMatchNode(
                doc(
                    p(
                        strong(a(em(code('https://example.com')))),
                        code('\t'),
                        '\t',
                        strong(a(em('x', sb(), 'y'))),
                    ),
                ),
            );
        });

        it('should close ending code emphasis before shared whitespace and a linked image', () => {
            const text = serializer.serialize(
                doc(
                    p(
                        strong(em(code('*'))),
                        strong('\t'),
                        strong(a(em(img({src: 'a', alt: 'img'})))),
                        strong('x\t '),
                        '*',
                    ),
                ),
            );
            expect(text).toBe('***`*`*\t[*![img](a)*](foo)x**\t \\*');
            expect(parser.parse(text)).toMatchNode(
                doc(
                    p(
                        strong(em(code('*'))),
                        strong('\t'),
                        strong(a(em(img({src: 'a', alt: 'img'})))),
                        strong('x'),
                        '\t *',
                    ),
                ),
            );
        });
    });
    it.each(['hard', 'soft'])('should preserve %s breaks inside continuing emphasis', (kind) => {
        const {doc, p, em, br, sb, parser, serializer} = createFixture();
        const breakNode = kind === 'hard' ? br() : sb();
        const expectedDoc = doc(p(em('x', breakNode, 'y')));
        const expectedMarkup =
            kind === 'hard'
                ? dd`
                *x\\
                y*
              `
                : dd`
                *x
                y*
              `;

        expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });
});

function createFixture(
    markOrder: string[] = ['em', 'strong', 'link', 'code'],
    markSpecs: Record<string, SerializerMarkToken> = {},
) {
    const deps = new ExtensionsManager({
        extensions: (builder) => {
            builder
                .use(BaseSchemaSpecs, {})
                .use(HeadingSpecs, {})
                .use(BreaksSpecs, {})
                .use(LinkSpecs)
                .use(ImageSpecs)
                .use(BoldSpecs)
                .use(ItalicSpecs)
                .use(CodeSpecs);
            for (const [name, spec] of Object.entries(markSpecs))
                builder.overrideMarkSerializerSpec(name, () => spec);
        },
    }).buildDeps();
    const marks = markOrder.reduce(
        (ordered, name) => ordered.addToEnd(name, deps.schema.marks[name].spec),
        deps.schema.spec.marks,
    );
    const schema = new Schema<string, string>({nodes: deps.schema.spec.nodes, marks});
    const baseParser = deps.markupParser;
    if (!(baseParser instanceof MarkdownParser)) throw new Error('Expected a MarkdownParser');
    const parser = new MarkdownParser(schema, baseParser.tokenizer, baseParser.tokens, {
        logger: new Logger2(),
        pmTransformers: baseParser.pmTransformers,
    });
    const nodes = builders<
        'doc' | 'p' | 'h1' | 'img' | 'br' | 'sb',
        'em' | 'strong' | 'a' | 'code'
    >(schema, {
        p: {nodeType: 'paragraph'},
        h1: {nodeType: 'heading', level: 1},
        img: {nodeType: 'image', src: 'a', alt: 'x'},
        br: {nodeType: 'hard_break'},
        sb: {nodeType: 'soft_break'},
        em: {markType: 'em'},
        strong: {markType: 'strong', 'data-markup': markSpecs.strong?.open ?? '**'},
        a: {markType: 'link', href: 'foo'},
        code: {markType: 'code'},
    });
    return {...nodes, parser, serializer: deps.serializer};
}

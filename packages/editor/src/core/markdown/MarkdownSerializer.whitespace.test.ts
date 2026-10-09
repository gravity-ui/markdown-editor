import {Schema} from 'prosemirror-model';
import {builders} from 'prosemirror-test-builder';
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

describe('MarkdownSerializer whitespace', () => {
    it('should preserve a code space after reordering emphasis', () => {
        const {doc, p, strong, a, em, code, parser, serializer} = createFixture();
        const input = doc(
            p(strong('a'), strong(a('b')), strong(a(em('c'))), em(code(' ')), em('d')),
        );
        const expectedDoc = doc(p(strong('a'), strong(a('b', em('c'))), code(' '), em('d')));
        const expectedMarkup = '**a[b*c*](foo)**` `*d*';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should preserve image emphasis after reordered code whitespace', () => {
        const {doc, p, strong, a, em, code, img, parser, serializer} = createFixture();
        const input = doc(p(strong(em(a('x'))), a(code(' ')), em(a(img({src: 'a'}))), a('y')));
        const expectedDoc = doc(p(strong(em(a('x'))), code(' '), em(a(img({src: 'a'}))), a('y')));
        const expectedMarkup = '***[x](foo)***` `*[![x](a)](foo)*[y](foo)';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should preserve emphasis when raw text ends before a soft break', () => {
        const {doc, p, em, sb, parser, serializer} = createFixture();
        const input = doc(p(em(' x\n ', sb(), 'y')));
        const expectedDoc = doc(p(em('x', sb(), 'y')));
        const expectedMarkup = ' *x\ny*';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it.each(['hard', 'soft'])('should expel whitespace before an unmarked %s break', (kind) => {
        const {doc, p, em, br, sb, parser, serializer} = createFixture();
        const breakNode = kind === 'hard' ? br() : sb();
        const input = doc(p(em('x '), breakNode, em('y')));
        const expectedDoc =
            kind === 'hard'
                ? doc(p(em('x'), ' ', breakNode, em('y')))
                : doc(p(em('x'), breakNode, em('y')));
        const expectedMarkup = kind === 'hard' ? '*x* \\\n*y*' : '*x* \n*y*';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep whitespace inside emphasis across a marked hard break', () => {
        const {doc, p, em, br, parser, serializer} = createFixture();
        const expectedDoc = doc(p(em('x ', br(), 'y')));
        const expectedMarkup = '*x \\\ny*';

        expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep link whitespace before an unmarked soft break', () => {
        const {doc, p, em, a, sb, parser, serializer} = createFixture();
        const expectedDoc = doc(p(em(a('x ')), sb(), em('z')));
        const expectedMarkup = '*[x ](foo)*\n*z*';

        expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should preserve multiline whitespace inside a standard link', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture();
        const input = doc(p(a('x\ny\n '), sb(), em('z')));
        const expectedDoc = doc(p(a('x', sb(), 'y', sb()), sb(), em('z')));
        const expectedMarkup = '[x\ny\n ](foo)\n*z*';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should expel all trailing whitespace when the link spec requests it', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture(undefined, {
            link: {
                open: () => '[',
                close: () => '](foo)',
                expelEnclosingWhitespace: true,
            },
        });
        const input = doc(p(a('x\ny\n '), sb(), em('z')));
        const expectedDoc = doc(p(a('x', sb(), 'y')), p(em('z')));
        const expectedMarkup = '[x\ny](foo)\n \n*z*';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should expel trailing spaces for custom emphasis delimiters', () => {
        const {doc, p, em, a, sb, parser, serializer} = createFixture(undefined, {
            em: {
                open: () => '[',
                close: () => '](foo)',
                mixable: true,
                expelEnclosingWhitespace: true,
            },
        });
        const input = doc(p(em('x '), sb(), em('z')));
        const expectedDoc = doc(p(a('x'), sb(), a('z')));
        const expectedMarkup = '[x](foo) \n[z](foo)';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it.each(['\u2028', '\u2029'])(
        'should preserve a %j separator inside heading marks',
        (space) => {
            const {doc, p, h1, strong, em, sb, parser, serializer} = createFixture([
                'strong',
                'em',
                'link',
                'code',
            ]);
            const input = doc(h1(strong('z'), strong(em('x' + space)), sb(), strong(em('y'))));
            const expectedDoc = doc(h1(strong('z', em('x' + space))), p(strong(em('y'))));
            const expectedMarkup = '# **z*x' + space + '***\n***y***';

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        },
    );

    it('should expel multiline emphasis whitespace after an ending link', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture();
        const input = doc(p(a('x'), em('y\nz ')));
        const expectedDoc = doc(p(a('x'), em('y', sb(), 'z')));
        const expectedMarkup = '[x](foo)*y\nz* ';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep multiline whitespace inside a custom non-escaping mark', () => {
        const {doc, p, em, code, sb, parser, serializer} = createFixture(undefined, {
            code: {
                open: () => '`',
                close: () => '`',
                escape: false,
                expelEnclosingWhitespace: true,
            },
        });
        const input = doc(p('z', code('x\ny\n '), sb(), em('w')));
        const expectedDoc = doc(p('z', code('x y  '), sb(), em('w')));
        const expectedMarkup = 'z`x\ny\n `\n*w*';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
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

import {Schema} from 'prosemirror-model';
import {schema as baseSchema, builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {
    MarkdownSerializer,
    type MarkdownSerializerState,
    type SerializerMarkToken,
} from './MarkdownSerializer';

const schema = new Schema({
    nodes: baseSchema.spec.nodes
        .update('hard_break', {
            ...baseSchema.spec.nodes.get('hard_break'),
            isBreak: true,
            breakType: 'hard',
        })
        .addToEnd('soft_break', {inline: true, group: 'inline', isBreak: true, breakType: 'soft'}),
    marks: baseSchema.spec.marks.addBefore('em', 'unknown', {}),
});

const {doc, p, i, b, u, br, sb} = builders(schema, {
    doc: {nodeType: 'doc'},
    p: {nodeType: 'paragraph'},
    i: {markType: 'em'},
    b: {markType: 'strong'},
    u: {markType: 'unknown'},
    br: {nodeType: 'hard_break'},
    sb: {nodeType: 'soft_break'},
});

describe('MarkdownSerializer overlapping marks', () => {
    it.each([false, true])(
        'should close marks before a dropped space with strong first: %s',
        (strongFirst) => {
            const orderedSchema = new Schema({
                nodes: schema.spec.nodes,
                marks: strongFirst
                    ? schema.spec.marks
                          .remove('strong')
                          .addBefore('em', 'strong', schema.marks.strong.spec)
                    : schema.spec.marks,
            });
            const {
                doc: document,
                p: paragraph,
                i: italic,
                b: bold,
            } = builders(orderedSchema, {
                p: {nodeType: 'paragraph'},
                i: {markType: 'em'},
                b: {markType: 'strong'},
            });
            const content = document(paragraph(bold(italic('x')), italic(' '), 'y'));

            expect(createSerializer().serialize(content)).toBe('***x*** y');
        },
    );

    it('should preserve a custom outer mark while closing inner emphasis', () => {
        const serializer = createSerializer({unknown: {open: '[', close: ']'}});
        const content = doc(p(u(i('x')), b(' '), 'y'));

        expect(serializer.serialize(content)).toBe('[*x* ]y');
    });

    it('should keep a custom inner mark open when outer emphasis continues', () => {
        const orderedSchema = new Schema({
            nodes: schema.spec.nodes,
            marks: schema.spec.marks.remove('em').addBefore('unknown', 'em', schema.marks.em.spec),
        });
        const {
            doc: document,
            p: paragraph,
            i: italic,
            b: bold,
            u: custom,
        } = builders(orderedSchema, {
            p: {nodeType: 'paragraph'},
            i: {markType: 'em'},
            b: {markType: 'strong'},
            u: {markType: 'unknown'},
        });
        const serializer = createSerializer({unknown: {open: '[', close: ']'}});
        const content = document(paragraph(italic(custom('x'), bold(' '), 'y')));

        expect(serializer.serialize(content)).toBe('*[x ]y*');
    });

    it('should keep emphasis open across an expelled whitespace-only mark', () => {
        expect(createSerializer().serialize(doc(p(i('hello'), b(' '), i('world'))))).toBe(
            '*hello world*',
        );
    });

    it('should keep emphasis and whitespace across consecutive YFM breaks', () => {
        const content = doc(p(i('foo ', br(), br(), 'bar')));

        expect(createSerializer().serialize(content)).toBe('*foo \\\n\\\nbar*');
    });

    it('should keep emphasis and whitespace across a YFM soft break', () => {
        const content = doc(p(i('foo ', sb(), 'bar')));

        expect(createSerializer().serialize(content)).toBe('*foo \nbar*');
    });

    it('should expel trailing whitespace before a final break', () => {
        const content = doc(p(i('foo ', br())));

        expect(createSerializer().serialize(content)).toBe('*foo* ');
    });

    it('should expel trailing whitespace when an outer mark breaks emphasis', () => {
        const serializer = createSerializer({unknown: {open: '[', close: ']'}});
        const content = doc(p(b('foo '), u(b('bar'))));

        expect(serializer.serialize(content)).toBe('**foo** [**bar**]');
    });

    it('should expel trailing whitespace when emphasis is reordered', () => {
        const content = doc(p(b('f'), i(b('oo '), 'bar')));

        expect(createSerializer().serialize(content)).toBe('**f*oo*** *bar*');
    });

    it('should preserve emphasis with reversed mark ranks', () => {
        const reversedSchema = new Schema({
            nodes: schema.spec.nodes,
            marks: schema.spec.marks
                .remove('strong')
                .addBefore('em', 'strong', schema.marks.strong.spec),
        });
        const {
            doc: reversedDoc,
            p: paragraph,
            i: italic,
            b: bold,
        } = builders(reversedSchema, {
            p: {nodeType: 'paragraph'},
            i: {markType: 'em'},
            b: {markType: 'strong'},
        });
        const content = reversedDoc(paragraph(bold('f'), italic(bold('oo '), 'bar')));

        expect(createSerializer().serialize(content)).toBe('**f*oo*** *bar*');
    });

    it('should expel leading whitespace when emphasis is reopened', () => {
        const content = doc(p(b('f'), i(b('oo'), ' bar')));

        expect(createSerializer().serialize(content)).toBe('**f*oo*** *bar*');
    });
});

describe('MarkdownSerializer line breaks', () => {
    it('should keep a renamed soft break after spaces', () => {
        const renamedSchema = new Schema({
            nodes: schema.spec.nodes
                .remove('soft_break')
                .addToEnd('line_feed', schema.nodes.soft_break.spec),
            marks: schema.spec.marks,
        });
        const nodes = builders(renamedSchema, {
            p: {nodeType: 'paragraph'},
            i: {markType: 'em'},
            sb: {nodeType: 'line_feed'},
        });
        const input = nodes.doc(nodes.p(nodes.i('x'), '  ', nodes.sb(), nodes.i('y')));

        expect(createSerializer({}, 'line_feed').serialize(input)).toBe('*x*\n*y*');
    });
});

describe('MarkdownSerializer unknown marks', () => {
    it('should reject an unknown mark in strict mode', () => {
        expect(() => createSerializer().serialize(doc(p(u('text'))))).toThrow(/unknown/);
    });

    it('should preserve continuous emphasis when ignoring an unknown mark', () => {
        const content = doc(p(i('f'), u(i('oo ')), i('bar')));

        expect(createSerializer().serialize(content, {strict: false})).toBe('*foo bar*');
    });
});

describe('MarkdownSerializer escaping options', () => {
    it('should escape extra characters once when YFM already escapes them', () => {
        expect(
            createSerializer().serialize(doc(p('foo|bar!')), {escapeExtraCharacters: /[|!]/g}),
        ).toBe(String.raw`foo\|bar\!`);
    });

    it('should escape literal backslashes once with extra escaping', () => {
        const content = doc(p(String.raw`foo\|bar!`));

        expect(createSerializer().serialize(content, {escapeExtraCharacters: /[\\|!]/g})).toBe(
            String.raw`foo\\\|bar\!`,
        );
    });

    it('should keep extra regex flags independent of the default rules', () => {
        const serializer = createSerializer();
        const content = doc(p('HiHi!'));

        expect(serializer.serialize(content, {escapeExtraCharacters: /h/i})).toBe(
            String.raw`\HiHi!`,
        );
        expect(serializer.serialize(content, {escapeExtraCharacters: /h/gi})).toBe(
            String.raw`\Hi\Hi!`,
        );
    });

    it('should combine extra escaping with a custom common escape rule', () => {
        const content = doc(p(String.raw`foo\|bar!`));

        expect(
            createSerializer().serialize(content, {
                commonEscape: /[|!]/g,
                escapeExtraCharacters: /[\\|!]/g,
            }),
        ).toBe(String.raw`foo\\\|bar\!`);
    });

    it('should escape once with named groups in custom regex rules', () => {
        expect(
            createSerializer().serialize(doc(p('foo|bar!')), {
                commonEscape: /(?<character>[|!])/g,
                escapeExtraCharacters: /(?<character>[|!])/g,
            }),
        ).toBe(String.raw`foo\|bar\!`);
    });

    it('should apply extra escaping with cold and warm caches', () => {
        const serializer = createSerializer();
        const paragraph = p('foo!');
        const content = doc(paragraph);
        const options = {escapeExtraCharacters: /!/g};

        expect(serializer.serialize(content, options)).toBe('foo\\!');
        expect(serializer.serialize(content, options)).toBe('foo\\!');
        expect(serializer.serialize(doc(paragraph), options)).toBe('foo\\!');
        expect(serializer.serialize(content)).toBe('foo!');
    });
});

describe('MarkdownSerializer block markers', () => {
    it.each([
        ['  # heading', String.raw`  \# heading`],
        ['###\u00a0text', '\\###\u00a0text'],
        ['#', String.raw`\#`],
        ['1. foo', String.raw`1\. foo`],
        ['  12.\tfoo', '  12\\.\tfoo'],
    ])('should escape a block marker in %j', (text, markdown) => {
        expect(createSerializer().serialize(doc(p(text)))).toBe(markdown);
    });

    it('should honor a custom heading escape rule', () => {
        expect(createSerializer().serialize(doc(p('#hashtag')), {startOfLineEscape: /^#/})).toBe(
            String.raw`\#hashtag`,
        );
        expect(createSerializer().serialize(doc(p('# text')), {startOfLineEscape: /^:/})).toBe(
            '# text',
        );
    });

    it.each([
        ['++added++', String.raw`\+\+added\+\+`],
        [':name:', String.raw`\:name:`],
        ['^up^', String.raw`\^up\^`],
        ['{#anchor}', String.raw`\{#anchor\}`],
    ])('should preserve YFM escaping in %j', (text, markdown) => {
        expect(createSerializer().serialize(doc(p(text)))).toBe(markdown);
    });

    it.each([
        ['#hashtag', String.raw`\#hashtag`],
        ['#######', String.raw`\#######`],
    ])('should preserve conservative heading escaping in %s', (text, markdown) => {
        expect(createSerializer().serialize(doc(p(text)))).toBe(markdown);
    });

    it('should preserve conservative escaping for a decimal', () => {
        expect(createSerializer().serialize(doc(p('1.2kg')))).toBe(String.raw`1\.2kg`);
    });
});

describe('MarkdownSerializer inline options', () => {
    it.each(['\n', '\r', '\r\n'])(
        'should normalize text line endings with an explicit space option: %j',
        (ending) => {
            const serializer = createSerializer({}, 'soft_break', {textLineBreaks: 'space'});
            expect(serializer.serialize(doc(p(`a${ending}b`)))).toBe('a b');
        },
    );

    it('should preserve text line endings by default', () => {
        expect(createSerializer().serialize(doc(p('a\nb')))).toBe('a\nb');
    });

    it('should keep explicit breaks when normalizing text line endings', () => {
        const serializer = createSerializer({}, 'soft_break', {textLineBreaks: 'space'});
        expect(serializer.serialize(doc(p('a\nb', sb(), 'c', br(), 'd')))).toBe('a b\nc\\\nd');
    });

    it.each([false, true])(
        'should preserve the boolean block-start argument: %s',
        (atBlockStart) => {
            const input = doc(p('# heading'));
            const legacy = createSerializer({}, 'soft_break', atBlockStart);
            const options = createSerializer({}, 'soft_break', {atBlockStart});
            expect(options.serialize(input)).toBe(legacy.serialize(input));
        },
    );
});

describe('MarkdownSerializer block wrapping', () => {
    it('should keep an empty first delimiter when ensuring a newline', () => {
        const serializer = new MarkdownSerializer(
            {
                paragraph: (state, node) => {
                    state.wrapBlock('> ', '', node, () => {
                        state.ensureNewLine();
                        state.text('first\nsecond');
                    });
                },
            },
            {},
        );

        expect(serializer.serialize(doc(p()))).toBe('> first\n> second');
    });
});

function createSerializer(
    marks: Record<string, SerializerMarkToken> = {},
    softBreakName = 'soft_break',
    inlineOptions?: Parameters<MarkdownSerializerState['renderInline']>[1],
) {
    return new MarkdownSerializer(
        {
            text: (state, node) => state.text(node.text ?? ''),
            paragraph: (state, node) => {
                state.renderInline(node, inlineOptions);
                state.closeBlock(node);
            },
            hard_break: (state, _node, parent, index) => {
                if (index < parent.childCount - 1) state.write('\\\n');
            },
            [softBreakName]: (state, _node, parent, index) => {
                if (index < parent.childCount - 1) state.write('\n');
            },
        },
        {
            em: {open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true},
            strong: {open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true},
            ...marks,
        },
    );
}

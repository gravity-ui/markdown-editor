import {Schema} from 'prosemirror-model';
import {schema as baseSchema, builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {MarkdownSerializer, type SerializerMarkToken} from './MarkdownSerializer';

const schema = new Schema({
    nodes: baseSchema.spec.nodes
        .update('hard_break', {...baseSchema.spec.nodes.get('hard_break'), isBreak: true})
        .addToEnd('soft_break', {inline: true, group: 'inline', isBreak: true}),
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

function createSerializer(marks: Record<string, SerializerMarkToken> = {}) {
    return new MarkdownSerializer(
        {
            text: (state, node) => state.text(node.text ?? ''),
            paragraph: (state, node) => {
                state.renderInline(node);
                state.closeBlock(node);
            },
            hard_break: (state, _node, parent, index) => {
                if (index < parent.childCount - 1) state.write('\\\n');
            },
            soft_break: (state, _node, parent, index) => {
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

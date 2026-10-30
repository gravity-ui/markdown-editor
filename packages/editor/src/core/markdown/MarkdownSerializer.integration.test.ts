import {Schema} from 'prosemirror-model';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {Logger2} from '../../logger';
import {DefaultSpecsPreset} from '../../presets/default-specs';
import {ExtensionsManager} from '../ExtensionsManager';

import {MarkdownParser} from './MarkdownParser';

describe('MarkdownSerializer production marks', () => {
    it('should keep continuing emphasis across differently marked spaces', () => {
        const {doc, p, em, strong, parser, serializer} = createFixture();
        const input = doc(p(em('x'), strong(em(' ')), strong(' '), strong(em('y'))));
        const text = serializer.serialize(input);

        expect(text).toBe('*x  **y***');
        expect(parser.parse(text)).toMatchNode(doc(p(em('x  ', strong('y')))));
    });

    it('should keep deferred whitespace inside the ending linked emphasis', () => {
        const {doc, p, strong, em, a, parser, serializer} = createFixture([
            'strong',
            'em',
            'link',
            'code',
        ]);
        const input = doc(p(strong(em(a('x '))), strong(a(' '))));
        const text = serializer.serialize(input);

        expect(text).toBe('***[x ](foo)*** ');
        expect(parser.parse(text)).toMatchNode(doc(p(strong(em(a('x '))))));
    });

    it.each(['`y`', '`` y`z ``'])(
        'should keep a code NBSP outside the previous link before %s',
        (nextCode) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse('[***x***](foo)*`\u00a0`*' + nextCode);
            const expected = '[***x***](foo)\u00a0' + nextCode;
            const text = serializer.serialize(input);

            expect(text).toBe(expected);
            expect(parser.parse(text)).toMatchNode(parser.parse(expected));
        },
    );

    it('should keep an emphasized image with a code mark after a link', () => {
        const {doc, p, a, strong, em, code, img, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code(img()))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(a(strong(em('x'))), em(img()))),
        );
    });

    it.each(['[***x***](foo)*`y`*', '[**~~x~~**](foo)~~`x`~~'])(
        'should keep formatting on inline code after a link in %s',
        (source) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse(source);

            expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
        },
    );

    it('should keep continuing link and strike on a code space', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('[***~~x~~***~~` `y~~](foo)');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });
});

describe('MarkdownSerializer mark boundary compatibility', () => {
    it.each(['*x` `**y**.*', '~~x ` `[y](foo)~~'])(
        'should preserve loaded formatting around a continuing code space in %s',
        (source) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse(source);

            expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
        },
    );

    it('should keep the next code text after an ASCII code space', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('[***x***](foo)*` `*`x`');
        const expected = parser.parse('[***x***](foo) `x`');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    it('should keep text after emphasized code before bold text', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code('y')), strong('z')));

        expect(parser.parse(serializer.serialize(input)).textContent).toBe('xyz');
    });

    it('should keep linked text after struck inline code', () => {
        const {doc, p, a, strong, em, s, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em(s('x')))), a(s(code('y'))), a('z')));

        expect(parser.parse(serializer.serialize(input)).textContent).toBe('xyz');
    });

    it('should keep an image after a raw newline in code', () => {
        const {doc, h1, a, strong, s, code, img, parser, serializer} = createFixture([
            'em',
            'link',
            'strong',
            'strike',
            'code',
        ]);
        const input = doc(h1(code('\n'), a(strong(s('*'))), s(code(img())), code('x')));
        let imageCount = 0;
        parser.parse(serializer.serialize(input)).descendants((node) => {
            if (node.type.name === 'image') imageCount++;
        });

        expect(imageCount).toBe(1);
    });

    it('should keep text after a marked image and a code space', () => {
        const {doc, p, strong, em, code, img, parser, serializer} = createFixture();
        const input = doc(p(strong('中'), strong(em(img())), strong('x'), strong(code(' ')), '.y'));

        expect(parser.parse(serializer.serialize(input)).textContent).toBe('中x .y');
    });

    it.each(['\u2028', '\u00a0'])(
        'should keep text when a separator %j precedes reordered code',
        (separator) => {
            const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
            const input = doc(p(a(strong(em('x' + separator))), em(code('y'))));

            expect(parser.parse(serializer.serialize(input)).textContent).toBe(
                'x' + separator + 'y',
            );
        },
    );

    it('should keep both enclosing spaces around nonempty code', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code(' y ')), a(em('z'))));

        expect(parser.parse(serializer.serialize(input)).textContent).toBe('x y z');
    });

    it('should keep an existing trailing code space after a link', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code(' '))));

        expect(parser.parse(serializer.serialize(input)).textContent).toBe('x ');
    });
});

describe('MarkdownSerializer code and image boundaries', () => {
    it('should keep an image after reordered code marks', () => {
        const {doc, p, strong, em, s, code, img, parser, serializer} = createFixture();
        const input = doc(p(strong(em(s('x'))), s(code(img()))));

        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(doc(p(strong(em(s('x'))), s(img()))));
    });

    // TODO: Preserve code spaces at mark boundaries.
    it.fails.each([
        {name: 'bold', source: '**x ` `**'},
        {name: 'italic', source: '*`d` ` `*'},
        {name: 'strike', source: '~~`d` ` `~~'},
        {name: 'heading bold', source: '# **x ` `**'},
        {name: 'bold before a soft break', source: '**x ` `**\ny'},
        {name: 'bold before a hard break', source: '**x ` `**\\\ny'},
    ])('should keep $name when its last code span contains a space', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });

    // TODO: Preserve code spaces at mark boundaries.
    it.fails.each([
        {name: 'bold before punctuation', source: '**x ` `**.'},
        {name: 'italic before punctuation', source: '*`d` ` `*!'},
        {name: 'bold before a link', source: '**x ` `**[y](u)'},
        {name: 'bold before inline code', source: '**x ` `**`y`'},
        {name: 'bold in a sentence', source: 'Use **`npm` ` `**, then run.'},
        {name: 'bold after NBSP', source: '**x\u00a0` `**'},
        {name: 'bold after NBSP before punctuation', source: '**x\u00a0` `**.'},
        {name: 'italic after a letter', source: '*x` `*'},
    ])('should keep $name when its last code span contains a space', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });

    it('should keep strike on inline code after reordered marks', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('***~~x~~***~~`y`~~');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });

    it('should preserve inline code text after a struck code space', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('~~***x***` `~~`y`');
        const expected = parser.parse('***~~x~~*** `y`');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    it('should keep expelled spaces outside emphasis when its delimiter can close', () => {
        const {doc, p, em, strong, parser, serializer} = createFixture();
        const input = doc(p(em('x'), strong(' '), strong(em('y'))));
        const text = serializer.serialize(input);

        expect(text).toBe('*x* ***y***');
        expect(parser.parse(text)).toMatchNode(doc(p(em('x'), ' ', strong(em('y')))));
    });

    it('should keep strike boundaries across spaces inside continuing emphasis', () => {
        const {doc, p, em, strong, s, parser, serializer} = createFixture();
        const input = doc(p(em(s('x')), em('  '), em(strong(s('y')))));
        const text = serializer.serialize(input);

        expect(text).toBe('*~~x~~  **~~y~~***');
        expect(parser.parse(text)).toMatchNode(input);
    });

    it.each([
        {name: 'inline code', source: '***x [`y`](foo)***[`z`](foo)'},
        {name: 'code with backticks', source: '***x [`y`](foo)***[`` z`w ``](foo)'},
    ])('should keep a link on $name after reordered emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });

    // TODO: Keep links on code before images.
    it.fails('should keep a link on code before an image after reordered emphasis', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('***x [`y`](foo)***[`z`](foo)![x](a)');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });
});

describe('MarkdownSerializer Unicode and multiline text', () => {
    it.each([
        {name: 'bold ending with U+2028', source: '**x\u2028y!\u2028**z'},
        {name: 'bold ending with U+2029', source: '**x\u2029y!\u2029**z'},
        {name: 'strike ending with U+2028', source: '~~x\u2028y!\u2028~~z'},
        {name: 'strike ending with U+2029', source: '~~x\u2029y!\u2029~~z'},
        {name: 'heading ending with U+2028', source: '# **x\u2028y!\u2028**z'},
        {name: 'heading ending with U+2029', source: '# **x\u2029y!\u2029**z'},
        {name: 'italic ending with U+2028', source: '*x\u2028y!\u2028*z'},
        {name: 'italic ending with U+2029', source: '*x\u2029y!\u2029*z'},
    ])('should preserve $name text inside emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });

    // TODO: Preserve text and marks around Unicode separators.
    it.fails.each([
        {name: 'paragraph U+2028', source: '*a **x \u2028y***'},
        {name: 'paragraph U+2029', source: '*a **x \u2029y***'},
        {name: 'heading U+2028', source: '# *a **x \u2028y***'},
        {name: 'heading U+2029', source: '# *a **x \u2029y***'},
        {name: 'link U+2028', source: '[a *x \u2028y*](foo)'},
        {name: 'link U+2029', source: '[a *x \u2029y*](foo)'},
        {name: 'single-line bold ending with U+2028', source: '**x y!\u2028**z'},
        {name: 'single-line bold ending with U+2029', source: '**x y!\u2029**z'},
    ])('should preserve $name text inside emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });

    it.each(['\u2028', '\u2029'])(
        'should keep text between nested marks separated by %j',
        (separator) => {
            const {doc, p, strong, s, parser, serializer} = createFixture();
            const input = doc(p(strong(s(`x${separator}`)), `!${separator}`, strong('!')));

            const text = serializer.serialize(input);

            expect(parser.parse(text).textContent).toBe(`x${separator}!${separator}!`);
        },
    );

    // TODO: Preserve multiline text inside emphasis.
    it.fails.each(['\n', '\r', '\r\n'])(
        'should preserve text after a raw %j line ending inside continuing emphasis',
        (ending) => {
            const {doc, p, em, strong, parser, serializer} = createFixture();
            const input = doc(p(em('a ', strong(`x ${ending}y`))));
            const expected = `*a **x ${ending}y***`;
            const text = serializer.serialize(input);

            expect(text).toBe(expected);
            expect(parser.parse(text)).toMatchNode(parser.parse(expected));
        },
    );

    it('should preserve multiline whitespace inside a standard link', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture();
        const input = doc(p(a('x\ny\n '), sb(), em('z')));
        const expectedDoc = doc(p(a('x', sb(), 'y', sb()), sb(), em('z')));
        const expectedMarkup = '[x\ny\n ](foo)\n*z*';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    // TODO: Close emphasis before trailing whitespace.
    it.fails('should expel multiline emphasis whitespace after an ending link', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture();
        const input = doc(p(a('x'), em('y\nz ')));
        const expectedDoc = doc(p(a('x'), em('y', sb(), 'z')));
        const expectedMarkup = '[x](foo)*y\nz* ';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    // TODO: Preserve emphasis inside links.
    it.fails('should keep multiline heading whitespace inside a standard link', () => {
        const {doc, h1, em, a, parser, serializer} = createFixture();
        const expectedDoc = doc(h1(em(a('x\u2028y '))));

        expect(parser.parse(serializer.serialize(expectedDoc))).toMatchNode(expectedDoc);
    });

    it('should keep multiline heading whitespace inside inline code', () => {
        const {doc, h1, em, code, parser, serializer} = createFixture();
        const expectedDoc = doc(h1(em(code('x\u2028y '))));
        const expectedMarkup = '# *`x\u2028y `*';

        const text = serializer.serialize(expectedDoc);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    // TODO: Preserve emphasis inside links.
    it.fails('should keep isolated multiline whitespace inside a standard link', () => {
        const {doc, p, em, strong, a, sb, parser, serializer} = createFixture();
        const input = doc(p(em(strong(a('x\ny ')))));
        const expectedDoc = doc(p(em(strong(a('x', sb(), 'y ')))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expectedDoc);
    });

    it('should keep isolated multiline whitespace inside inline code', () => {
        const {doc, p, em, strong, code, parser, serializer} = createFixture();
        const input = doc(p(em(strong(code('x\ny ')))));
        const expectedDoc = doc(p(em(strong(code('x y ')))));
        const expectedMarkup = '***`x\ny `***';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });
});

describe('MarkdownSerializer line breaks', () => {
    it('should keep text when a code space precedes an unmarked hard break', () => {
        const {doc, p, em, code, br, parser, serializer} = createFixture();
        const input = doc(p('x', em(code(' ')), br(), em('z')));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(doc(p('x ', br(), em('z'))));
    });

    it('should preserve emphasis when raw text ends before a soft break', () => {
        const {doc, p, em, sb, parser, serializer} = createFixture();
        const input = doc(p(em(' x\n ', sb(), 'y')));
        const expectedDoc = doc(p(em('x', sb(), 'y')));
        const expectedMarkup = ' *x\ny*';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    // TODO: Close marks before unmarked breaks.
    it.fails.each([
        {kind: 'hard', markOrder: ['em', 'strong', 'link', 'code']},
        {kind: 'soft', markOrder: ['em', 'strong', 'link', 'code']},
        {kind: 'hard', markOrder: ['strong', 'em', 'link', 'code']},
        {kind: 'soft', markOrder: ['strong', 'em', 'link', 'code']},
    ])(
        'should expel nested emphasis whitespace before $kind breaks with $markOrder',
        ({kind, markOrder}) => {
            const {doc, p, em, strong, br, sb, parser, serializer} = createFixture(markOrder);
            const breakNode = kind === 'hard' ? br() : sb();
            const input = doc(p(em(strong('x ')), breakNode, em(strong('y'))));
            const expectedDoc =
                kind === 'hard'
                    ? doc(p(em(strong('x')), ' ', breakNode, em(strong('y'))))
                    : doc(p(em(strong('x')), breakNode, em(strong('y'))));
            const expectedMarkup = kind === 'hard' ? '***x*** \\\n***y***' : '***x***\n***y***';

            const text = serializer.serialize(input);

            expect(text).toBe(expectedMarkup);
            expect(parser.parse(text)).toMatchNode(expectedDoc);
        },
    );

    // TODO: Close marks before unmarked breaks.
    it.fails.each(['hard', 'soft'])(
        'should preserve %s breaks after expelling two spaces',
        (kind) => {
            const {doc, p, em, strong, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const input = doc(p(em(strong('x  ')), breakNode, em(strong('y'))));
            const expectedDoc =
                kind === 'hard'
                    ? doc(p(em(strong('x')), '  ', breakNode, em(strong('y'))))
                    : doc(p(em(strong('x')), breakNode, em(strong('y'))));
            const expectedMarkup = kind === 'hard' ? '***x***  \\\n***y***' : '***x***\n***y***';

            const text = serializer.serialize(input);

            expect(text).toBe(expectedMarkup);
            expect(parser.parse(text)).toMatchNode(expectedDoc);
        },
    );

    // TODO: Preserve emphasis inside links before breaks.
    it.fails.each(['hard', 'soft'])(
        'should keep nested link whitespace before unmarked %s breaks',
        (kind) => {
            const {doc, p, em, strong, a, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const expectedDoc = doc(p(em(strong(a('x '))), breakNode, em(strong(a('y')))));

            expect(parser.parse(serializer.serialize(expectedDoc))).toMatchNode(expectedDoc);
        },
    );

    it.each(['hard', 'soft'])(
        'should keep nested inline code whitespace before unmarked %s breaks',
        (kind) => {
            const {doc, p, em, strong, code, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const expectedDoc = doc(p(em(strong(code('x '))), breakNode, em(strong(code('y')))));
            const expectedMarkup =
                kind === 'hard' ? '***`x `***\\\n***`y`***' : '***`x `***\n***`y`***';

            const text = serializer.serialize(expectedDoc);

            expect(text).toBe(expectedMarkup);
            expect(parser.parse(text)).toMatchNode(expectedDoc);
        },
    );

    it.each(['hard', 'soft'])(
        'should keep nested emphasis whitespace across marked %s breaks',
        (kind) => {
            const {doc, p, em, strong, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const input = doc(p(em(strong('x ', breakNode, 'y'))));
            const expectedDoc = kind === 'hard' ? input : doc(p(em(strong('x', breakNode, 'y'))));
            const expectedMarkup = kind === 'hard' ? '***x \\\ny***' : '***x \ny***';

            const text = serializer.serialize(input);

            expect(text).toBe(expectedMarkup);
            expect(parser.parse(text)).toMatchNode(expectedDoc);
        },
    );

    // TODO: Close marks before unmarked breaks.
    it.fails.each(['hard', 'soft'])(
        'should expel whitespace before an unmarked %s break',
        (kind) => {
            const {doc, p, em, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const input = doc(p(em('x '), breakNode, em('y')));
            const expectedDoc =
                kind === 'hard'
                    ? doc(p(em('x'), ' ', breakNode, em('y')))
                    : doc(p(em('x'), breakNode, em('y')));
            const expectedMarkup = kind === 'hard' ? '*x* \\\n*y*' : '*x*\n*y*';

            const text = serializer.serialize(input);

            expect(text).toBe(expectedMarkup);
            expect(parser.parse(text)).toMatchNode(expectedDoc);
        },
    );
});

describe('MarkdownSerializer whitespace boundaries', () => {
    it.each(['\u2028', '\u2029'])(
        'should keep literal punctuation before a code space and %j',
        (separator) => {
            const {doc, p, em, code, parser, serializer} = createFixture([]);
            const input = doc(p(em('*'), em(code(' ')), separator, 'x'));

            const text = serializer.serialize(input);

            expect(parser.parse(text)).toMatchNode(doc(p(em('*'), ` ${separator}x`)));
        },
    );

    it('should keep continuing emphasis across wholly expelled code whitespace', () => {
        const {doc, p, em, strong, code, parser, serializer} = createFixture([
            'strong',
            'em',
            'link',
            'code',
        ]);
        const input = doc(p(em('x'), strong(em(code(' '))), em('y')));
        const expectedDoc = doc(p(em('x y')));
        const expectedMarkup = '*x y*';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    it('should keep wholly expelled code whitespace inside a standard link', () => {
        const {doc, p, em, a, code, parser, serializer} = createFixture();
        const input = doc(p(a('x'), em(a(code(' '))), 'y'));
        const expectedDoc = doc(p(a('x '), 'y'));
        const expectedMarkup = '[x ](foo)y';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });
});

function createFixture(markOrder: string[] = []) {
    const deps = new ExtensionsManager({
        extensions: (builder) => builder.use(DefaultSpecsPreset, {}),
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
        'em' | 'strong' | 's' | 'a' | 'code'
    >(schema, {
        p: {nodeType: 'paragraph'},
        h1: {nodeType: 'heading', level: 1},
        br: {nodeType: 'hard_break'},
        sb: {nodeType: 'soft_break'},
        img: {nodeType: 'image', src: 'a', alt: 'x'},
        em: {markType: 'em'},
        strong: {markType: 'strong'},
        s: {markType: 'strike'},
        a: {markType: 'link', href: 'foo'},
        code: {markType: 'code'},
    });
    return {...nodes, parser, serializer: deps.serializer};
}

import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {DefaultSpecsPreset} from '../../../presets/default-specs';
import {ExtensionsManager} from '../../ExtensionsManager';

describe('MarkdownSerializer marks', () => {
    it('should keep an image after reordered code marks', () => {
        const {doc, p, strong, em, s, code, img, parser, serializer} = createFixture();
        const input = doc(p(strong(em(s('x'))), s(code(img()))));

        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(doc(p(strong(em(s('x'))), s(img()))));
    });

    it('should keep emphasis on an image with a code mark after a link', () => {
        const {doc, p, a, strong, em, code, img, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code(img()))));

        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(doc(p(a(strong(em('x'))), em(img()))));
    });

    it('should keep text after a marked image and a code space', () => {
        const {doc, p, strong, em, code, img, parser, serializer} = createFixture();
        const input = doc(p(strong('中'), strong(em(img())), strong('x'), strong(code(' ')), '.y'));

        const text = serializer.serialize(input);

        expect(parser.parse(text).textContent).toBe('中x .y');
    });

    // TODO: Fix closing marks after reordered code before the next text node.
    it.fails('should keep text after emphasized inline code before bold text', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code('y')), strong('z')));

        const text = serializer.serialize(input);

        expect(parser.parse(text).textContent).toBe('xyz');
    });

    it.fails('should keep linked text after struck inline code', () => {
        const {doc, p, a, strong, em, s, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em(s('x')))), a(s(code('y'))), a('z')));

        const text = serializer.serialize(input);

        expect(parser.parse(text).textContent).toBe('xyz');
    });

    it.each([
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

        expect(text).toBe(source);
        expect(parser.parse(text)).toMatchNode(input);
    });

    // TODO: Keep code spaces at mark boundaries.
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

        expect(text).toBe(source);
        expect(parser.parse(text)).toMatchNode(input);
    });

    it.each([
        {name: 'strike', source: '***~~x~~***~~`y`~~'},
        {name: 'emphasis after a link', source: '[***x***](foo)*`y`*'},
        {name: 'strike after a link', source: '[**~~x~~**](foo)~~`x`~~'},
    ])('should keep $name on inline code after reordered marks', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });

    it.each([
        {name: 'paragraph U+2028', source: '*a **x \u2028y***'},
        {name: 'paragraph U+2029', source: '*a **x \u2029y***'},
        {name: 'heading U+2028', source: '# *a **x \u2028y***'},
        {name: 'heading U+2029', source: '# *a **x \u2029y***'},
        {name: 'link U+2028', source: '[a *x \u2028y*](foo)'},
        {name: 'link U+2029', source: '[a *x \u2029y*](foo)'},
        {name: 'bold ending with U+2028', source: '**x\u2028y!\u2028**z'},
        {name: 'bold ending with U+2029', source: '**x\u2029y!\u2029**z'},
        {name: 'strike ending with U+2028', source: '~~x\u2028y!\u2028~~z'},
        {name: 'strike ending with U+2029', source: '~~x\u2029y!\u2029~~z'},
        {name: 'heading ending with U+2028', source: '# **x\u2028y!\u2028**z'},
        {name: 'heading ending with U+2029', source: '# **x\u2029y!\u2029**z'},
        {name: 'italic ending with U+2028', source: '*x\u2028y!\u2028*z'},
        {name: 'italic ending with U+2029', source: '*x\u2029y!\u2029*z'},
        {name: 'single-line bold ending with U+2028', source: '**x y!\u2028**z'},
        {name: 'single-line bold ending with U+2029', source: '**x y!\u2029**z'},
    ])('should preserve $name text inside emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(text).toBe(source);
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

    it.each(['\n', '\r', '\r\n'])(
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

    it.each([
        {
            name: 'a struck code space',
            source: '~~***x***` `~~`y`',
            expected: '***~~x~~*** `y`',
        },
        {
            name: 'an emphasized code NBSP',
            source: '[***x***](foo)*`\u00a0`*`y`',
            expected: '[***x***](foo)\u00a0`y`',
        },
        {
            name: 'a code NBSP before code with backticks',
            source: '[***x***](foo)*`\u00a0`*`` y`z ``',
            expected: '[***x***](foo)\u00a0`` y`z ``',
        },
    ])('should preserve inline code text after $name', ({source, expected}) => {
        const {parser, serializer} = createFixture();
        const text = serializer.serialize(parser.parse(source));

        expect(text).toBe(expected);
        expect(parser.parse(text)).toMatchNode(parser.parse(expected));
    });

    it('should keep link and strike on a code space after nested emphasis', () => {
        const {parser, serializer} = createFixture();
        const source = '[***~~x~~***~~` `y~~](foo)';
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(text).toBe(source);
        expect(parser.parse(text)).toMatchNode(input);
    });

    it('should keep continuing emphasis across differently marked spaces', () => {
        const {doc, p, em, strong, parser, serializer} = createFixture();
        const input = doc(p(em('x'), strong(em(' ')), strong(' '), strong(em('y'))));
        const text = serializer.serialize(input);

        expect(text).toBe('*x  **y***');
        expect(parser.parse(text)).toMatchNode(doc(p(em('x  ', strong('y')))));
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
        {name: 'code before an image', source: '***x [`y`](foo)***[`z`](foo)![x](a)'},
    ])('should keep a link on $name after reordered emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });
});

function createFixture() {
    const deps = new ExtensionsManager({
        extensions: (builder) => builder.use(DefaultSpecsPreset, {}),
    }).buildDeps();
    const nodes = builders<'doc' | 'p' | 'img', 'em' | 'strong' | 's' | 'a' | 'code'>(deps.schema, {
        p: {nodeType: 'paragraph'},
        em: {markType: 'em'},
        strong: {markType: 'strong', 'data-markup': '**'},
        s: {markType: 'strike'},
        a: {markType: 'link', href: 'foo'},
        code: {markType: 'code'},
        img: {nodeType: 'image', src: 'a', alt: 'x'},
    });
    return {...nodes, parser: deps.markupParser, serializer: deps.serializer};
}

import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {DefaultSpecsPreset} from '../../../presets/default-specs';
import {ExtensionsManager} from '../../ExtensionsManager';

describe('MarkdownSerializer marks', () => {
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
    ])('should preserve $name text inside emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(text).toBe(source);
        expect(parser.parse(text)).toMatchNode(input);
    });

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
    const nodes = builders<'doc' | 'p', 'em' | 'strong' | 's'>(deps.schema, {
        p: {nodeType: 'paragraph'},
        em: {markType: 'em'},
        strong: {markType: 'strong', 'data-markup': '**'},
        s: {markType: 'strike'},
    });
    return {...nodes, parser: deps.markupParser, serializer: deps.serializer};
}

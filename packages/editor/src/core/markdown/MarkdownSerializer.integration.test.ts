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

    it('should keep an unlinked space outside the previous emphasized link', () => {
        const {doc, p, em, strong, a, parser, serializer} = createFixture([
            'em',
            'strong',
            'link',
            'code',
        ]);
        const input = doc(p(em(a('x')), em(strong(' ')), a('y')));
        const text = serializer.serialize(input);

        expect(text).toBe('*[x](foo)* [y](foo)');
        expect(parser.parse(text)).toMatchNode(doc(p(em(a('x')), ' ', a('y'))));
    });

    it('should keep a normalized heading space before nested emphasis', () => {
        const {doc, h1, em, strong, parser, serializer} = createFixture([
            'em',
            'strong',
            'link',
            'code',
        ]);
        const input = doc(h1(strong(' y\n'), strong(em('x'))));
        const text = serializer.serialize(input);

        expect(text).toBe('#  **y *x***');
        expect(parser.parse(text)).toMatchNode(doc(h1(strong('y ', em('x')))));
    });

    it('should keep separate link targets across expelled whitespace', () => {
        const {doc, p, em, a, parser, serializer} = createFixture();
        const input = doc(p(em(a({href: 'foo'}, 'x ')), em(a({href: 'bar'}, 'y'))));
        const expected = doc(p(em(a({href: 'foo'}, 'x')), ' ', em(a({href: 'bar'}, 'y'))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
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

        // Emphasis on this code was already lost before the regression.
        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(a(strong(em('x'))), code('y'), strong('z'))),
        );
    });

    it('should keep linked text after struck inline code', () => {
        const {doc, p, a, strong, em, s, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em(s('x')))), a(s(code('y'))), a('z')));

        // Strike on this code was already lost before the regression.
        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(a(strong(em(s('x')))), a(code('y')), a('z'))),
        );
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
        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(h1(code(' '), a(strong(s('*'))), s(img()), code('x'))),
        );
    });

    it('should keep text after a marked image and a code space', () => {
        const {doc, p, strong, em, code, img, parser, serializer} = createFixture();
        const input = doc(p(strong('中'), strong(em(img())), strong('x'), strong(code(' ')), '.y'));

        // These image boundaries already changed bold to italic.
        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(em('中'), img(), em('x'), ' .y')),
        );
    });

    it.each(['\u2028', '\u00a0'])(
        'should keep text when a separator %j precedes reordered code',
        (separator) => {
            const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
            const input = doc(p(a(strong(em('x' + separator))), em(code('y'))));

            // U+2028 already lost emphasis on code before the regression.
            const expectedCode = separator === '\u00a0' ? em(code('y')) : code('y');

            expect(parser.parse(serializer.serialize(input))).toMatchNode(
                doc(p(a(strong(em('x'))), separator, expectedCode)),
            );
        },
    );

    it('should keep both enclosing spaces around nonempty code', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code(' y ')), a(em('z'))));

        // Keep the leading code-space normalization.
        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(a(strong(em('x'))), ' ', em(code('y ')), a(em('z')))),
        );
    });

    it('should keep an existing trailing code space after a link', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(a(strong(em('x'))), em(code(' '))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(a(strong(em('x')), ' '))),
        );
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

        expect(parser.parse(text)).toMatchNode(input);
    });

    // TODO: Preserve marks around Unicode separators.
    it.fails.each(['\u2028', '\u2029'])(
        'should preserve single-line bold ending with %j',
        (separator) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse(`**x y!${separator}**z`);

            expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
        },
    );

    it.each(['\u2028', '\u2029'])(
        'should keep text between nested marks separated by %j',
        (separator) => {
            const {doc, p, strong, s, parser, serializer} = createFixture();
            const input = doc(p(strong(s(`x${separator}`)), `!${separator}`, strong('!')));

            const text = serializer.serialize(input);

            // These separators already moved the bold boundary.
            expect(parser.parse(text)).toMatchNode(
                doc(p(strong(s('x'), `${separator}!${separator}`), '!')),
            );
        },
    );

    it.each(['\n', '\r', '\r\n'])(
        'should normalize a raw %j heading line ending to a space',
        (ending) => {
            const {doc, h1, em, strong, parser, serializer} = createFixture();
            const input = doc(h1(em('Left', strong(`Mid ${ending}Tail `), 'Right')));
            const expected = doc(h1(em('Left', strong('Mid  Tail'), ' Right')));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        },
    );

    it('should reuse normalized heading output without changing its text or the next block', () => {
        const {doc, h1, p, strong, em, parser, serializer} = createFixture();
        const heading = h1(strong(' x\ny'));
        const paragraph = p(strong('z '), strong(em(' ')), 'w');
        const input = doc(heading, paragraph);
        const expectedHeading = h1(strong('x y'));
        const expectedParagraph = p(strong('z'), '  w');
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(doc(expectedHeading, expectedParagraph));
        expect(serializer.serialize(input)).toBe(text);
        expect(serializer.serialize(doc(heading, paragraph))).toBe(text);
        expect(
            parser.parse(serializer.serialize(doc(p('prefix'), heading, paragraph))),
        ).toMatchNode(doc(p('prefix'), expectedHeading, expectedParagraph));
        expect(heading.textContent).toBe(' x\ny');
    });

    it.each(['\n', '\r', '\r\n'])(
        'should normalize inline code line endings %j inside a heading',
        (ending) => {
            const {doc, h1, code, parser, serializer} = createFixture();
            const input = doc(h1('foo ', code(`aa${ending}bb${ending}cc`), ' bar'));
            const expected = doc(h1('foo ', code('aa bb cc'), ' bar'));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
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

    it('should preserve multiline whitespace inside a standard link', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture();
        const input = doc(p(a('x\ny\n '), sb(), em('z')));
        const expectedDoc = doc(p(a('x', sb(), 'y', sb()), sb(), em('z')));
        const expectedMarkup = '[x\ny\n ](foo)\n*z*';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    it('should expel multiline emphasis whitespace after an ending link', () => {
        const {doc, p, a, em, sb, parser, serializer} = createFixture();
        const input = doc(p(a('x'), em('y\nz ')));
        const expectedDoc = doc(p(a('x'), em('y', sb(), 'z')));
        const expectedMarkup = '[x](foo)*y\nz* ';

        const text = serializer.serialize(input);

        expect(text).toBe(expectedMarkup);
        expect(parser.parse(text)).toMatchNode(expectedDoc);
    });

    it('should keep multiline heading whitespace inside a standard link', () => {
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

    it('should keep isolated multiline whitespace inside a standard link', () => {
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

describe('MarkdownSerializer trailing whitespace', () => {
    it('should close bold before differently marked trailing spaces', () => {
        const {doc, p, strong, em, parser, serializer} = createFixture();
        const input = doc(p(strong('x '), strong(em(' ')), 'y'));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(doc(p(strong('x'), '  y')));
    });

    it('should close nested marks before an unmarked whitespace node', () => {
        const {doc, p, strong, em, parser, serializer} = createFixture();
        const input = doc(p(strong(em('Left  ')), ' ', strong(em('Right'))));
        const expected = doc(p(strong(em('Left')), '   ', strong(em('Right'))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    it('should keep underscore marks around a mixed whitespace chain', () => {
        const {doc, p, strong, em, s, parser, serializer} = createFixture();
        const left = strong({'data-markup': '__'}, em({'data-markup': '_'}, 'Left'));
        const right = strong({'data-markup': '__'}, em({'data-markup': '_'}, 'Right'));
        const input = doc(p(left, strong(' '), em(' '), s(' '), right));
        const expected = doc(p(left, '   ', right));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    it('should keep a soft break after a marked whitespace chain', () => {
        const {doc, p, strong, em, sb, parser, serializer} = createFixture();
        const input = doc(p(strong('Left'), strong(' '), strong(em(' ')), sb(), em('Right')));
        const expected = doc(p(strong('Left'), sb(), em('Right')));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    it('should preserve all linked lines after a code space', () => {
        const {doc, p, strong, em, a, code, sb, parser, serializer} = createFixture([
            'strong',
            'link',
            'em',
            'code',
        ]);
        const input = doc(p(strong(a(em(code('u')))), em(code(' ')), strong(a(em(' x\ny')))));
        const expected = doc(
            p(strong(a(em(code('u')))), em(code(' ')), em(' '), strong(a(em('x', sb(), 'y')))),
        );

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });
});

describe('MarkdownSerializer line breaks', () => {
    it('should keep text when a code space precedes an unmarked hard break', () => {
        const {doc, p, em, code, br, parser, serializer} = createFixture();
        const input = doc(p('x', em(code(' ')), br(), em('z')));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(doc(p('x ', br(), em('z'))));
    });

    it('should keep a soft break after unmarked spaces', () => {
        const {doc, p, em, sb, parser, serializer} = createFixture();
        const input = doc(p(em('x'), '  ', sb(), em('y')));
        const expected = doc(p(em('x'), sb(), em('y')));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
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

    it.each([
        {separator: '\u2028', kind: 'hard'},
        {separator: '\u2029', kind: 'hard'},
        {separator: '\u2028', kind: 'soft'},
        {separator: '\u2029', kind: 'soft'},
    ])(
        'should keep marks on a Unicode separator before a $kind break ($separator)',
        ({separator, kind}) => {
            const {doc, p, em, s, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const input = doc(p(em(s(` Left${separator} `)), breakNode, em(s('Right'))));
            const expected =
                kind === 'hard'
                    ? doc(p(em(s(`Left${separator}`)), ' ', breakNode, em(s('Right'))))
                    : doc(p(em(s(`Left${separator}`)), breakNode, em(s('Right'))));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        },
    );

    it.each(['\n', '\r', '\r\n'])(
        'should keep a single soft break after linked raw trailing whitespace %j',
        (ending) => {
            const {doc, p, a, em, sb, parser, serializer} = createFixture();
            const input = doc(p(a(em(` Left${ending} `), em(sb()), em('Right'))));
            const expected = doc(p(a(em('Left', sb(), 'Right'))));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        },
    );

    it.each([
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

    it.each(['hard', 'soft'])('should preserve %s breaks after expelling two spaces', (kind) => {
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
    });

    it.each(['hard', 'soft'])(
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

    it.each(['hard', 'soft'])('should expel whitespace before an unmarked %s break', (kind) => {
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
    });
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

describe('MarkdownSerializer reviewed regressions', () => {
    it.each(['*', '**', '~~'])(
        'should keep %s formatting around a link before a letter',
        (delimiter) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse(`${delimiter}a${delimiter}[${delimiter}b${delimiter}](u)c`);

            expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
        },
    );

    it.each(['*', '**', '~~'])(
        'should keep %s formatting around a link before a space',
        (delimiter) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse(`${delimiter}a${delimiter}[${delimiter}b${delimiter}](u) c`);

            expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
        },
    );

    it.each([
        '*`a `**b***',
        '*`a `[b](u)*',
        '~~`a `*b*~~',
        '[*a*](u)*` a`*',
        '[**a**](u)**` a`**',
        '[~~a~~](u)~~` a`~~',
        '[*a*](u)*``  a`  ``b*',
        '[**a**](u)**``  a`  ``b**',
        '[~~a~~](u)~~``  a`  ``b~~',
    ])('should keep spaces inside code when outer marks continue in %s', (source) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });

    it('should keep bold on a link after a code space before a letter', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('**` `**[**x**](u)x');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });
});

describe('MarkdownSerializer deferred whitespace regressions', () => {
    it.each([' ', '\t'])(
        'should keep strike on code after deferred whitespace %j in a formatted link',
        (space) => {
            const {doc, p, a, em, s, code, parser, serializer} = createFixture();
            const input = doc(p(a(em(s('A' + space))), s(code('B'))));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(
                doc(p(a(em(s('A'))), space, s(code('B')))),
            );
        },
    );

    it('should keep emphasis on code after a nested link with enclosing spaces', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p(strong(em('A')), a(strong(em(' B '))), em(code('C'))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(
            doc(p(strong(em('A')), ' ', a(strong(em('B'))), ' ', em(code('C')))),
        );
    });
});

describe('MarkdownSerializer known delimiter regressions', () => {
    it.each(['***`A`****` B C`*', '___`A`____` B C`_'])(
        'should keep code spaces after valid adjacent delimiters in %s',
        (source) => {
            const {parser, serializer} = createFixture();
            const input = parser.parse(source);

            expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
        },
    );

    it('should keep the code space when a link opens after nested bold', () => {
        const {doc, p, strong, em, code, a, parser, serializer} = createFixture();
        const input = doc(p(strong(em('A')), a(em(code(' B C')))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });

    it('should keep emphasis around linked code with a Unicode line separator', () => {
        const {doc, p, a, em, code, parser, serializer} = createFixture();
        const input = doc(p(em('A'), a(em(code('B\u2029C '))), 'C'));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(input);
    });

    it('should keep the leading code space at a formatted link boundary', () => {
        const {parser, serializer} = createFixture();
        const input = parser.parse('**L**[**``  a  ``**](u)R');
        // The trailing space already loses its marks before this regression.
        const expected = parser.parse('**L**[**` a`**](u) R');

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    it('should keep emphasis on code after closing nested bold', () => {
        const {doc, p, strong, em, code, parser, serializer} = createFixture();
        const input = doc(p('A ', strong(em('B')), em(code(' C'))));
        // Keep the existing code-space normalization.
        const expected = doc(p('A ', strong(em('B')), ' ', em(code('C'))));

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
    });

    // TODO: Keep formatting around raw multiline code inside a link.
    it.fails.each([
        {name: 'bold and italic', strike: false},
        {name: 'bold, italic and strike', strike: true},
    ])('should keep $name on multiline code inside a link', ({strike}) => {
        const {doc, p, a, strong, em, s, code, parser, serializer} = createFixture();
        const rawCode = code('a\nb');
        const normalizedCode = code('a b');
        const input = doc(p(a(em('L'), strong(em(strike ? s(rawCode) : rawCode))), 'R'));
        const expected = doc(
            p(a(em('L'), strong(em(strike ? s(normalizedCode) : normalizedCode))), 'R'),
        );

        expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
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

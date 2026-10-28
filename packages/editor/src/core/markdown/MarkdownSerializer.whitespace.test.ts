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
import {StrikeSpecs} from '../../extensions/markdown/Strike/StrikeSpecs';
import {Logger2} from '../../logger';
import {ExtensionsManager} from '../ExtensionsManager';

import {MarkdownParser} from './MarkdownParser';
import type {SerializerMarkToken} from './MarkdownSerializer';

describe('MarkdownSerializer whitespace', () => {
    it('should keep ending emphasis when a custom raw mark expels spaces', () => {
        const {doc, p, em, strong, a, s, parser, serializer} = createFixture(
            ['strong', 'em', 'link', 'strike', 'code'],
            {
                em: {
                    open: '*',
                    close: '*',
                    mixable: true,
                    expelEnclosingWhitespace: true,
                    escape: false,
                },
            },
        );
        const input = doc(p(em(a('!')), strong(em(a('y '))), strong(em('  ')), strong(em(s('z')))));
        const text = serializer.serialize(input);

        const marks: string[] = [];
        parser.parse(text).descendants((node) => {
            if (node.text?.includes('z')) marks.push(...node.marks.map((mark) => mark.type.name));
        });
        expect(marks).toEqual(['strong', 'em', 'strike']);
    });

    it('should keep custom raw emphasis separate from code whitespace', () => {
        const {doc, p, em, strong, a, s, code, parser, serializer} = createFixture([], {
            em: {
                open: '*',
                close: '*',
                mixable: true,
                expelEnclosingWhitespace: false,
                escape: false,
            },
        });
        const input = doc(p(a(strong(s(em('y ')))), s(em(' ')), s(em(code(' z ')))));
        const text = serializer.serialize(input);
        const marks: string[] = [];
        parser.parse(text).descendants((node) => {
            if (node.text?.includes('z')) marks.push(...node.marks.map((mark) => mark.type.name));
        });

        expect(marks).toEqual(['strike', 'em', 'code']);
    });

    it('should preserve loaded code text after a marked code space', () => {
        const {doc, p, a, strong, em, code, parser, serializer} = createFixture([
            'link',
            'strong',
            'em',
            'strike',
            'code',
        ]);
        const input = parser.parse('[***x***](foo)*` `*`x`');
        const text = serializer.serialize(input);

        expect(text).toBe('[***x*** ](foo)`x`');
        expect(parser.parse(text)).toMatchNode(doc(p(a(strong(em('x')), ' '), code('x'))));
    });

    it('should preserve loaded marks before nested code after a code space', () => {
        const {doc, p, a, strong, s, em, code, parser, serializer} = createFixture([
            'link',
            'strong',
            'strike',
            'em',
            'code',
        ]);
        const input = parser.parse('[***x***](foo)*` `*[**~~*`y`*~~**](foo)');
        const text = serializer.serialize(input);

        expect(text).toBe('[***x***](foo)` `[**~~*`y`*~~**](foo)');
        expect(parser.parse(text)).toMatchNode(
            doc(p(a(strong(em('x'))), code(' '), a(strong(s(em(code('y'))))))),
        );
    });

    it.each(['\u2028', '\u2029'])(
        'should preserve a %j separator before custom code with empty delimiters',
        (separator) => {
            const {doc, p, a, strong, s, code, parser, serializer} = createFixture([], {
                code: {open: () => '', close: () => '', escape: false},
            });
            const input = doc(p(a(strong(s('x'))), s(code(separator)), code('y'), 'z'));
            const text = serializer.serialize(input);

            expect(text).toBe(`[**~~x~~**](foo)${separator}yz`);
            expect(parser.parse(text)).toMatchNode(doc(p(a(strong(s('x'))), separator + 'yz')));
        },
    );

    it('should preserve code whitespace before an image with a code mark', () => {
        const {doc, p, a, strong, s, code, img, parser, serializer} = createFixture([]);
        const input = doc(p(a(strong(s('x'))), s(code(' ')), code(img()), 'z'));
        const text = serializer.serialize(input);

        expect(text).toBe('[**~~x~~**](foo)` `![x](a)z');
        expect(parser.parse(text)).toMatchNode(doc(p(a(strong(s('x'))), code(' '), img(), 'z')));
    });

    it('should preserve emphasis when custom code uses empty delimiters', () => {
        const {doc, p, em, strong, a, s, code, parser, serializer} = createFixture(
            ['em', 'strong', 'link', 'strike', 'code'],
            {code: {open: () => '', close: () => '', escape: false}},
        );
        const input = doc(p(em(strong(a(s('x')))), em(s(code(' '))), code('y')));
        const text = serializer.serialize(input);

        expect(text).toBe('***[~~x~~](foo)*** y');
        expect(parser.parse(text)).toMatchNode(doc(p(em(strong(a(s('x')))), ' y')));
    });

    it('should preserve custom raw emphasis around a code space', () => {
        const {doc, p, em, strong, s, code, parser, serializer} = createFixture(
            ['em', 'strong', 'link', 'strike', 'code'],
            {
                em: {
                    open: '*',
                    close: '*',
                    mixable: true,
                    expelEnclosingWhitespace: true,
                    escape: false,
                },
            },
        );
        const input = doc(p(em(strong(s('x'))), s(code(' ')), em('y')));
        const text = serializer.serialize(input);

        expect(text).toBe('***~~x~~***` `*y*');
        expect(parser.parse(text)).toMatchNode(doc(p(em(strong(s('x'))), code(' '), em('y'))));
    });

    it('should preserve emphasis before custom code that expels a leading newline', () => {
        const {doc, p, em, strong, a, s, code, sb, parser, serializer} = createFixture(
            ['em', 'strong', 'link', 'strike', 'code'],
            {code: {open: '`', close: '`', escape: false, expelEnclosingWhitespace: true}},
        );
        const input = doc(p(em(strong(a(s('x')))), em(s(code(' '))), code('\ny'), sb()));
        const text = serializer.serialize(input);

        expect(text).toBe('***[~~x~~](foo)***` `\n`y`');
        expect(parser.parse(text)).toMatchNode(
            doc(p(em(strong(a(s('x')))), code(' '), sb(), code('y'))),
        );
    });

    it.each(['\u2028', '\u2029'])(
        'should preserve literal stars after %j whitespace with custom code delimiters',
        (separator) => {
            const {doc, p, strong, em, code, parser, serializer} = createFixture([], {
                code: {open: '', close: '', escape: false},
            });
            const input = doc(p(strong('x '), strong(em(code('\t' + separator))), code('**y**')));
            const text = serializer.serialize(input);

            expect(parser.parse(text).textContent.replace(/\s/g, '')).toBe('x**y**');
        },
    );

    it('should preserve loaded emphasis after a code space', () => {
        const {doc, p, em, strong, parser, serializer} = createFixture([
            'link',
            'strong',
            'em',
            'code',
        ]);
        const input = parser.parse('*x` `**y**.*');
        const text = serializer.serialize(input);

        expect(text).toBe('*x **y**.*');
        expect(parser.parse(text)).toMatchNode(doc(p(em('x ', strong('y'), '.'))));
    });

    it('should preserve loaded strike before a code space and a link', () => {
        const {doc, p, s, a, parser, serializer} = createFixture([
            'link',
            'strong',
            'em',
            'strike',
            'code',
        ]);
        const input = parser.parse('~~x ` `[y](foo)~~');
        const text = serializer.serialize(input);

        expect(text).toBe('~~x  [y](foo)~~');
        expect(parser.parse(text)).toMatchNode(doc(p(s('x  ', a('y')))));
    });

    it('should close ending emphasis before deferred code whitespace', () => {
        const {doc, p, em, strong, code, a, parser, serializer} = createFixture(
            ['em', 'link', 'strong', 'code'],
            {link: {open: '[', close: '](foo)', expelEnclosingWhitespace: true}},
        );
        const input = doc(p(strong('x '), em(strong(code(' '))), em(a(strong(' y')))));
        const text = serializer.serialize(input);

        expect(text).toBe('**x**   *[**y**](foo)*');
        expect(parser.parse(text)).toMatchNode(doc(p(strong('x'), '   ', em(a(strong('y'))))));
    });

    it('should close nested emphasis before a struck link after a code space', () => {
        const {doc, p, em, strong, code, s, a, parser, serializer} = createFixture();
        const input = doc(p(em(strong('x')), em(code(' ')), s(em(strong(a('y'))))));
        const text = serializer.serialize(input);

        expect(text).toBe('***x*** ~~***[y](foo)***~~');
        expect(parser.parse(text)).toMatchNode(doc(p(em(strong('x')), ' ', s(em(strong(a('y')))))));
    });

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

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
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

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it.each(['hard', 'soft'])(
        'should keep nested link whitespace before unmarked %s breaks',
        (kind) => {
            const {doc, p, em, strong, a, br, sb, parser, serializer} = createFixture();
            const breakNode = kind === 'hard' ? br() : sb();
            const expectedDoc = doc(p(em(strong(a('x '))), breakNode, em(strong(a('y')))));
            const expectedMarkup =
                kind === 'hard'
                    ? '***[x ](foo)***\\\n***[y](foo)***'
                    : '***[x ](foo)***\n***[y](foo)***';

            expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
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

            expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
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

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
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
        const expectedMarkup = '[x\ny](foo)\n\n*z*';

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
        const expectedMarkup = '[x](foo)\n[z](foo)';

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

    it('should close emphasis before wholly expelled code whitespace', () => {
        const {doc, p, em, strong, code, parser, serializer} = createFixture([
            'strong',
            'em',
            'link',
            'code',
        ]);
        const input = doc(p(em('x'), strong(em(code(' ')))));
        const expectedDoc = doc(p(em('x')));
        const expectedMarkup = '*x* ';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

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

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep wholly expelled code whitespace inside a standard link', () => {
        const {doc, p, em, a, code, parser, serializer} = createFixture();
        const input = doc(p(a('x'), em(a(code(' '))), 'y'));
        const expectedDoc = doc(p(a('x '), 'y'));
        const expectedMarkup = '[x ](foo)y';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it.each(['\u2028', '\u2029'])(
        'should expel heading emphasis whitespace across separator %j',
        (separator) => {
            const {doc, h1, em, parser, serializer} = createFixture();
            const input = doc(h1(em(`x${separator}y `)));
            const expectedDoc = doc(h1(em(`x${separator}y`)));
            const expectedMarkup = `# *x${separator}y* `;

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        },
    );

    it.each(['\u2028', '\u2029'])(
        'should expel nested heading emphasis whitespace across separator %j',
        (separator) => {
            const {doc, h1, em, strong, parser, serializer} = createFixture();
            const input = doc(h1(em(strong(`x${separator}y `))));
            const expectedDoc = doc(h1(em(strong(`x${separator}y`))));
            const expectedMarkup = `# ***x${separator}y*** `;

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        },
    );

    it('should keep multiline heading whitespace inside a standard link', () => {
        const {doc, h1, em, a, parser, serializer} = createFixture();
        const expectedDoc = doc(h1(em(a('x\u2028y '))));
        const expectedMarkup = '# *[x\u2028y ](foo)*';

        expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep multiline heading whitespace inside inline code', () => {
        const {doc, h1, em, code, parser, serializer} = createFixture();
        const expectedDoc = doc(h1(em(code('x\u2028y '))));
        const expectedMarkup = '# *`x\u2028y `*';

        expect(serializer.serialize(expectedDoc)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it.each([
        {markOrder: ['em', 'strong', 'link', 'code']},
        {markOrder: ['strong', 'em', 'link', 'code']},
    ])(
        'should expel multiline emphasis whitespace after unmarked text with $markOrder',
        ({markOrder}) => {
            const {doc, p, em, strong, sb, parser, serializer} = createFixture(markOrder);
            const input = doc(p('z ', em(strong('x\ny '))));
            const expectedDoc = doc(p('z ', em(strong('x', sb(), 'y'))));
            const expectedMarkup = 'z ***x\ny*** ';

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        },
    );

    it.each([
        {markOrder: ['em', 'strong', 'link', 'code']},
        {markOrder: ['strong', 'em', 'link', 'code']},
    ])(
        'should expel multiline emphasis whitespace before unmarked text with $markOrder',
        ({markOrder}) => {
            const {doc, p, em, strong, sb, parser, serializer} = createFixture(markOrder);
            const input = doc(p(em(strong('x\ny ')), 'z'));
            const expectedDoc = doc(p(em(strong('x', sb(), 'y')), ' z'));
            const expectedMarkup = '***x\ny*** z';

            expect(serializer.serialize(input)).toBe(expectedMarkup);
            expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
        },
    );

    it('should expel multiline whitespace after unmarked text with custom delimiters', () => {
        const {doc, p, em, strong, sb, parser, serializer} = createFixture(undefined, {
            strong: {open: '__', close: '__', mixable: true, expelEnclosingWhitespace: true},
        });
        const input = doc(p('z ', em(strong('x\ny '))));
        const expectedDoc = doc(p('z ', em(strong('x', sb(), 'y'))));
        const expectedMarkup = 'z *__x\ny__* ';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it.each([
        {markOrder: ['em', 'strong', 'link', 'code']},
        {markOrder: ['strong', 'em', 'link', 'code']},
    ])('should expel isolated multiline whitespace with $markOrder marks', ({markOrder}) => {
        const {doc, p, em, strong, sb, parser, serializer} = createFixture(markOrder);
        const input = doc(p(em(strong('x\ny '))));
        const expectedDoc = doc(p(em(strong('x', sb(), 'y'))));
        const expectedMarkup = '***x\ny*** ';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should expel isolated multiline whitespace with custom strong delimiters', () => {
        const {doc, p, em, strong, sb, parser, serializer} = createFixture(undefined, {
            strong: {open: '__', close: '__', mixable: true, expelEnclosingWhitespace: true},
        });
        const input = doc(p(em(strong('x\ny '))));
        const expectedDoc = doc(p(em(strong('x', sb(), 'y'))));
        const expectedMarkup = '*__x\ny__* ';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep isolated multiline whitespace inside a standard link', () => {
        const {doc, p, em, strong, a, sb, parser, serializer} = createFixture();
        const input = doc(p(em(strong(a('x\ny ')))));
        const expectedDoc = doc(p(em(strong(a('x', sb(), 'y ')))));
        const expectedMarkup = '***[x\ny ](foo)***';

        expect(serializer.serialize(input)).toBe(expectedMarkup);
        expect(parser.parse(expectedMarkup)).toMatchNode(expectedDoc);
    });

    it('should keep isolated multiline whitespace inside inline code', () => {
        const {doc, p, em, strong, code, parser, serializer} = createFixture();
        const input = doc(p(em(strong(code('x\ny ')))));
        const expectedDoc = doc(p(em(strong(code('x y ')))));
        const expectedMarkup = '***`x\ny `***';

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
                .use(StrikeSpecs)
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
        'em' | 'strong' | 'a' | 'code' | 's'
    >(schema, {
        p: {nodeType: 'paragraph'},
        h1: {nodeType: 'heading', level: 1},
        img: {nodeType: 'image', src: 'a', alt: 'x'},
        br: {nodeType: 'hard_break'},
        sb: {nodeType: 'soft_break'},
        em: {markType: 'em'},
        strong: {markType: 'strong', 'data-markup': markSpecs.strong?.open ?? '**'},
        a: {markType: 'link', href: 'foo'},
        s: {markType: 'strike'},
        code: {markType: 'code'},
    });
    return {...nodes, parser, serializer: deps.serializer};
}

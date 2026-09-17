import {builders} from 'prosemirror-test-builder';
import dedent from 'ts-dedent';

import {ExtensionsManager} from '#core';
import {DOMParser, DOMSerializer} from '#pm/model';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {BlockquoteSpecs} from 'src/extensions/markdown/Blockquote/BlockquoteSpecs';
import {BoldSpecs} from 'src/extensions/markdown/Bold/BoldSpecs';

import {createMarkupChecker} from '../../../../tests/sameMarkup';

import {
    HEADER_FILL_SWATCHES,
    HeaderActionType,
    HeaderBackground,
    HeaderBorder,
    HeaderDecor,
    HeaderEdges,
    HeaderFormat,
    HeaderLayout,
    HeaderNode,
    HeaderSpecs,
    HeaderTextColor,
    normalizeHeaderAttrs,
    serializeHeaderAttrs,
    serializeHeaderContent,
} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BoldSpecs, {}).use(BlockquoteSpecs).use(HeaderSpecs),
}).buildDeps();

const {doc, p, header, title, description, actions, action} = builders<
    'doc' | 'p' | 'header' | 'title' | 'description' | 'actions' | 'action'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    text: {nodeType: BaseNode.Text},
    header: {nodeType: HeaderNode.Header},
    title: {nodeType: HeaderNode.Title},
    description: {nodeType: HeaderNode.Description},
    actions: {nodeType: HeaderNode.Actions},
    action: {nodeType: HeaderNode.Action},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Header extension', () => {
    it('should parse an empty block', () =>
        same(
            dedent`
            :::header-block
            :::
            `,
            doc(header(title(), description(), actions())),
        ));

    it('should parse title, description and actions', () =>
        same(
            dedent`
            :::header-block
            ::header-title[Welcome to the portal]
            ::header-description[Everything the team needs, on one page.]
            ::header-action[Get started] {href="/start"}
            ::header-action[Docs] {href="/docs" type=link}
            :::
            `,
            doc(
                header(
                    title('Welcome to the portal'),
                    description('Everything the team needs, on one page.'),
                    actions(
                        action({type: HeaderActionType.Button, href: '/start'}, 'Get started'),
                        action({type: HeaderActionType.Link, href: '/docs'}, 'Docs'),
                    ),
                ),
            ),
        ));

    it('should omit empty slot directives', () =>
        same(
            dedent`
            :::header-block
            ::header-title[Only a title]
            :::
            `,
            doc(header(title('Only a title'), description(), actions())),
        ));

    it.each(HEADER_FILL_SWATCHES.map(({value}) => value))(
        'should round-trip button color=%s',
        (color) =>
            same(
                dedent`
            :::header-block
            ::header-action[Go] {href="/start" color=${color}}
            ::header-action[Docs] {href="/docs" type=link}
            :::
            `,
                doc(
                    header(
                        title(),
                        description(),
                        actions(
                            action({href: '/start', color}, 'Go'),
                            action({type: 'link', href: '/docs'}, 'Docs'),
                        ),
                    ),
                ),
            ),
    );

    it('should preserve a button color when copying HTML', () => {
        const content = doc(
            header(
                title(),
                description(),
                actions(action({href: '/start', color: 'contrast'}, 'Go')),
            ),
        );
        const element = document.createElement('div');
        element.append(DOMSerializer.fromSchema(schema).serializeFragment(content.content));
        expect(DOMParser.fromSchema(schema).parse(element)).toMatchNode(content);
    });

    it('should ignore unknown button colors', () => {
        const parsed = parser.parse(':::header-block\n::header-action[] {color=neon}\n:::\n');
        expect(parsed.firstChild?.child(2).firstChild?.attrs.color).toBe('brand');
        expect(serializer.serialize(parsed)).not.toContain('color=');
    });

    it('should keep markdown syntax in the text as plain characters', () =>
        same(
            dedent`
            :::header-block
            ::header-title[Hello **world**]
            :::
            `,
            doc(header(title('Hello **world**'), description(), actions())),
        ));

    it('should not serialize default attributes', () =>
        same(
            dedent`
            :::header-block
            ::header-title[Plain]
            :::
            `,
            doc(
                header(
                    {
                        format: HeaderFormat.Large,
                        edges: HeaderEdges.Rounded,
                        bg: HeaderBackground.Fill,
                        fill: 'blue',
                        text: HeaderTextColor.Auto,
                        border: HeaderBorder.None,
                    },
                    title('Plain'),
                    description(),
                    actions(),
                ),
            ),
        ));

    it('should round-trip every non-default attribute', () =>
        same(
            dedent`
            :::header-block {format=small edges=bleed bg=image layout=split fill=contrast text=light image="/hero.png" border=dashed}
            ::header-title[Styled]
            :::
            `,
            doc(
                header(
                    {
                        format: HeaderFormat.Small,
                        edges: HeaderEdges.Bleed,
                        bg: HeaderBackground.Image,
                        layout: HeaderLayout.Split,
                        fill: 'contrast',
                        text: 'light',
                        image: '/hero.png',
                        border: HeaderBorder.Dashed,
                    },
                    title('Styled'),
                    description(),
                    actions(),
                ),
            ),
        ));

    it('should preserve punctuation and dates as plain text', () =>
        same(
            dedent`
            :::header-block
            ::header-title[Release: 2020-01-01]
            ::header-description[Costs 100% — "quoted", it's fine]
            :::
            `,
            doc(
                header(
                    title('Release: 2020-01-01'),
                    description(`Costs 100% — "quoted", it's fine`),
                    actions(),
                ),
            ),
        ));

    it('should survive two blocks in a row', () =>
        same(
            dedent`
            :::header-block
            ::header-title[First]
            :::

            :::header-block {format=small}
            ::header-title[Second]
            :::
            `,
            doc(
                header(title('First'), description(), actions()),
                header({format: HeaderFormat.Small}, title('Second'), description(), actions()),
            ),
        ));

    it('should fall back to defaults on unknown attribute values', () => {
        const parsed = parser.parse(dedent`
            :::header-block {format=gigantic bg=video fill=neon border=groove}
            :::
        `);

        expect(parsed.firstChild?.attrs).toMatchObject({
            format: HeaderFormat.Large,
            bg: HeaderBackground.Fill,
            fill: 'blue',
            border: HeaderBorder.None,
        });
    });

    it('ignores unknown content while retaining valid directives', () => {
        expect(
            parser.parse(dedent`
            :::header-block
            ::header-title[Kept]
            ::unknown[Skipped]
            ::header-action[Broken
            :::

            After.
        `),
        ).toMatchNode(doc(header(title('Kept'), description(), actions()), p('After.')));
    });

    it('does not interpret header slots outside a header', () => {
        expect(parser.parse('::header-title[Ordinary text]').firstChild?.type.name).toBe(
            'paragraph',
        );
    });

    it('normalizes action attributes and preserves empty actions', () => {
        expect(
            parser.parse(':::header-block\n::header-action[] {type=ghost color=neon}\n:::'),
        ).toMatchNode(doc(header(title(), description(), actions(action()))));
    });

    it.each([
        '[brackets] \\ backslash &amp; & <script> **text**',
        'first\n:::header-block\n::header-action[Injected]\nlast',
        '  leading and trailing  ',
    ])('round-trips directive delimiters and literal text: %s', (text) => {
        const document = doc(
            header(title(text), description(text), actions(action({href: '/a?x=1&y=2'}, text))),
        );
        expect(parser.parse(serializer.serialize(document))).toMatchNode(document);
    });

    it.each(['/path with spaces', 'https://example.com/a?x="quoted"&y=two', '/back\\slash'])(
        'round-trips action URL: %s',
        (href) => {
            const document = doc(header(title(), description(), actions(action({href}, 'Go'))));
            expect(parser.parse(serializer.serialize(document))).toMatchNode(document);
        },
    );

    it('preserves directive slots and actions inside blockquotes', () => {
        const content = header(
            title('Quoted'),
            description('Text'),
            actions(action({href: '/go'}, 'Go')),
        );
        const document = schema.nodes.doc.create(
            null,
            schema.nodes.blockquote.create(null, content),
        );
        const markup = serializer.serialize(document);
        expect(markup).toContain('> ::header-action[Go] {href="/go"}');
        expect(parser.parse(markup)).toMatchNode(document);
    });

    it('writes nothing for empty slots', () => {
        expect(serializeHeaderContent({title: '', description: '', actions: []})).toBe('');
    });

    describe('attribute serialization', () => {
        it('should omit layout unless the background is an image', () => {
            expect(serializeHeaderAttrs({layout: HeaderLayout.Split})).toBe('');
            expect(
                serializeHeaderAttrs({bg: HeaderBackground.Image, layout: HeaderLayout.Split}),
            ).toBe(' {bg=image layout=split}');
        });

        it('should omit decor unless the background is a fill', () => {
            expect(serializeHeaderAttrs({decor: HeaderDecor.None})).toBe(' {decor=none}');
            expect(serializeHeaderAttrs({bg: HeaderBackground.Image, decor: HeaderDecor.None})).toBe(
                ' {bg=image}',
            );
        });

        it('should quote values that are not bare words', () => {
            expect(serializeHeaderAttrs({image: 'https://a.test/x y.png'})).toBe(
                ' {image="https://a.test/x y.png"}',
            );
        });

        it.each(HEADER_FILL_SWATCHES.map(({value}) => value))(
            'should round-trip fill=%s',
            (fill) => {
                expect(normalizeHeaderAttrs({fill}).fill).toBe(fill);
            },
        );
    });
});

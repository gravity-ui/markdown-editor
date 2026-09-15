import {builders} from 'prosemirror-test-builder';
import dedent from 'ts-dedent';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {BoldSpecs, boldMarkName} from 'src/extensions/markdown/Bold/BoldSpecs';

import {createMarkupChecker} from '../../../../tests/sameMarkup';

import {
    HEADER_FILL_SWATCHES,
    HeaderBackground,
    HeaderBorder,
    HeaderEdges,
    HeaderFormat,
    HeaderLayout,
    HeaderNode,
    HeaderSpecs,
    HeaderTextColor,
    normalizeHeaderAttrs,
    serializeHeaderAttrs,
} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BoldSpecs, {}).use(HeaderSpecs),
}).buildDeps();

const {doc, p, b, header, title, subtitle, actions, action} = builders<
    'doc' | 'p' | 'header' | 'title' | 'subtitle' | 'actions' | 'action',
    'b'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    text: {nodeType: BaseNode.Text},
    b: {markType: boldMarkName},
    header: {nodeType: HeaderNode.Header},
    title: {nodeType: HeaderNode.Title},
    subtitle: {nodeType: HeaderNode.Subtitle},
    actions: {nodeType: HeaderNode.Actions},
    action: {nodeType: HeaderNode.Action},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Header extension', () => {
    it('should parse a bare header', () =>
        same(
            dedent`
            :::header [Welcome]
            :::
            `,
            doc(header(title('Welcome'), subtitle(), actions())),
        ));

    it('should parse title, subtitle and actions', () =>
        same(
            dedent`
            :::header [Welcome to the portal]
            Everything the team needs, on one page.

            ::action[Get started]{href="/start"}
            ::action[Docs]{href="/docs" variant=link}
            :::
            `,
            doc(
                header(
                    title('Welcome to the portal'),
                    subtitle('Everything the team needs, on one page.'),
                    actions(
                        action({href: '/start', variant: 'primary'}, 'Get started'),
                        action({href: '/docs', variant: 'link'}, 'Docs'),
                    ),
                ),
            ),
        ));

    it('should keep inline marks inside the title', () =>
        same(
            dedent`
            :::header [Hello **world**]
            :::
            `,
            doc(header(title('Hello ', b('world')), subtitle(), actions())),
        ));

    it('should not serialize default attributes', () =>
        same(
            dedent`
            :::header [Plain]
            :::
            `,
            doc(
                header(
                    {
                        format: HeaderFormat.Large,
                        edges: HeaderEdges.Rounded,
                        bg: HeaderBackground.Fill,
                        fill: 'blue-light',
                        text: HeaderTextColor.Auto,
                        border: HeaderBorder.None,
                        blobs: true,
                        seed: 0,
                    },
                    title('Plain'),
                    subtitle(),
                    actions(),
                ),
            ),
        ));

    it('should round-trip every non-default attribute', () =>
        same(
            dedent`
            :::header [Styled] {format=small edges=bleed bg=image layout=split fill=dark text=light image="/hero.png" border=dashed blobs=false seed=7}
            :::
            `,
            doc(
                header(
                    {
                        format: HeaderFormat.Small,
                        edges: HeaderEdges.Bleed,
                        bg: HeaderBackground.Image,
                        layout: HeaderLayout.Split,
                        fill: 'dark',
                        text: 'light',
                        image: '/hero.png',
                        border: HeaderBorder.Dashed,
                        blobs: false,
                        seed: 7,
                    },
                    title('Styled'),
                    subtitle(),
                    actions(),
                ),
            ),
        ));

    it('should move extra blocks out of the header instead of dropping them', () => {
        const parsed = parser.parse(dedent`
            :::header [Title]
            Subtitle line.

            Stray paragraph.
            :::
        `);

        expect(parsed).toMatchNode(
            doc(header(title('Title'), subtitle('Subtitle line.'), actions()), p('Stray paragraph.')),
        );
    });

    it('should fall back to defaults on unknown attribute values', () => {
        const parsed = parser.parse(dedent`
            :::header [Title] {format=gigantic bg=video fill=neon border=groove blobs=maybe seed=-3}
            :::
        `);

        expect(parsed.firstChild?.attrs).toMatchObject({
            format: HeaderFormat.Large,
            bg: HeaderBackground.Fill,
            fill: 'blue-light',
            border: HeaderBorder.None,
            blobs: true,
            seed: 0,
        });
    });

    it('should survive being nested in a blockquote-free document twice', () =>
        same(
            dedent`
            :::header [First]
            :::

            :::header [Second] {format=small}
            :::
            `,
            doc(
                header(title('First'), subtitle(), actions()),
                header({format: HeaderFormat.Small}, title('Second'), subtitle(), actions()),
            ),
        ));

    describe('attribute serialization', () => {
        it('should omit layout unless the background is an image', () => {
            expect(serializeHeaderAttrs({layout: HeaderLayout.Split})).toBe('');
            expect(
                serializeHeaderAttrs({bg: HeaderBackground.Image, layout: HeaderLayout.Split}),
            ).toBe(' {bg=image layout=split}');
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

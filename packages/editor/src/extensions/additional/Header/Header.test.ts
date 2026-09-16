import {builders} from 'prosemirror-test-builder';
import dedent from 'ts-dedent';

import {ExtensionsManager} from '#core';
import {BaseNode, BaseSchemaSpecs} from 'src/extensions/base/specs';
import {BoldSpecs} from 'src/extensions/markdown/Bold/BoldSpecs';

import {createMarkupChecker} from '../../../../tests/sameMarkup';

import {
    HEADER_FILL_SWATCHES,
    HeaderActionType,
    HeaderBackground,
    HeaderBorder,
    HeaderEdges,
    HeaderFormat,
    HeaderLayout,
    HeaderNode,
    HeaderSpecs,
    HeaderTextColor,
    normalizeHeaderAttrs,
    parseHeaderContent,
    serializeHeaderAttrs,
    serializeHeaderContent,
} from './HeaderSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BoldSpecs, {}).use(HeaderSpecs),
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
            title: 'Welcome to the portal'
            description: 'Everything the team needs, on one page.'
            actions:
              - type: 'button'
                title: 'Get started'
                href: '/start'
              - type: 'link'
                title: 'Docs'
                href: '/docs'
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

    it('should omit keys of empty slots', () =>
        same(
            dedent`
            :::header-block
            title: 'Only a title'
            :::
            `,
            doc(header(title('Only a title'), description(), actions())),
        ));

    it('should keep markdown syntax in the text as plain characters', () =>
        same(
            dedent`
            :::header-block
            title: 'Hello **world**'
            :::
            `,
            doc(header(title('Hello **world**'), description(), actions())),
        ));

    it('should not serialize default attributes', () =>
        same(
            dedent`
            :::header-block
            title: 'Plain'
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
            title: 'Styled'
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

    it('should round-trip text that yaml would otherwise reinterpret', () =>
        same(
            dedent`
            :::header-block
            title: 'Release: 2020-01-01'
            description: 'Costs 100% — "quoted", it''s fine'
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
            title: 'First'
            :::

            :::header-block {format=small}
            title: 'Second'
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

    it('should produce an empty block instead of throwing on broken yaml', () => {
        const parsed = parser.parse(dedent`
            :::header-block
            title: 'Kept'
            actions: 'not a list'
              indented: [unclosed
            :::

            After.
        `);

        expect(parsed).toMatchNode(doc(header(title(), description(), actions()), p('After.')));
    });

    describe('content', () => {
        it('should drop actions that are not objects', () => {
            expect(parseHeaderContent("actions:\n  - 'oops'\n  - type: 'link'\n").actions).toEqual([
                {type: HeaderActionType.Link, title: '', href: ''},
            ]);
        });

        it('should fall back to a button for an unknown action type', () => {
            expect(parseHeaderContent("actions:\n  - type: 'ghost'\n").actions[0].type).toBe(
                HeaderActionType.Button,
            );
        });

        it('should write nothing for a block with empty slots', () => {
            expect(serializeHeaderContent({title: '', description: '', actions: []})).toBe('');
        });
    });

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

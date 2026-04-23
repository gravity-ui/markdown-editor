import type {Parser, Serializer} from '@gravity-ui/markdown-editor';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    ExtensionsManager,
    blockquoteNodeName,
} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {YfmPageConstructorSpecs} from './YfmPageConstructorSpecs';
import {YfmPageConstructorAttrs, yfmPageConstructorNodeName} from './const';

jest.mock('@gravity-ui/markdown-editor', () => {
    const actual = jest.requireActual('@gravity-ui/markdown-editor');
    return {
        ...actual,
        generateEntityId: (name = 'entity') => `${name}-eff-000-0ab`,
    };
});

function createMarkupChecker({parser, serializer}: {parser: Parser; serializer: Serializer}) {
    function parse(text: string, doc: Node) {
        expect(parser.parse(text).toJSON()).toEqual(doc.toJSON());
    }

    function serialize(doc: Node, text: string) {
        expect(serializer.serialize(doc)).toBe(text);
    }

    function same(text: string, doc: Node) {
        parse(text, doc);
        serialize(doc, text);
    }

    return {same, parse, serialize};
}

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(YfmPageConstructorSpecs, {}),
}).buildDeps();

const {doc, yfmPageConstructor, quote} = builders<'doc' | 'yfmPageConstructor' | 'quote'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    yfmPageConstructor: {nodeType: yfmPageConstructorNodeName},
    quote: {nodeType: blockquoteNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('YfmPageConstructor extension', () => {
    it('should parse yfm page-constructor block', () =>
        same(
            '::: page-constructor\nblocks:\n  - type: "header-block"\n    title: "Title"\n:::',
            doc(
                yfmPageConstructor({
                    [YfmPageConstructorAttrs.content]:
                        'blocks:\n  - type: "header-block"\n    title: "Title"\n',
                    [YfmPageConstructorAttrs.EntityId]: `${yfmPageConstructorNodeName}-eff-000-0ab`,
                }),
            ),
        ));

    it('should parse yfm page-constructor block with multiline yaml', () => {
        const yamlContent = dd`
        blocks:
          - type: "header-block"
            title: "Hello World"
            description: "Some description"

        `;

        const markup = dd`
        ::: page-constructor
        blocks:
          - type: "header-block"
            title: "Hello World"
            description: "Some description"
        :::
        `;

        same(
            markup,
            doc(
                yfmPageConstructor({
                    [YfmPageConstructorAttrs.content]: yamlContent,
                    [YfmPageConstructorAttrs.EntityId]: `${yfmPageConstructorNodeName}-eff-000-0ab`,
                }),
            ),
        );
    });

    it('should parse yfm page-constructor inside blockquote', () => {
        const content = dd`
        blocks:
          - type: "header-block"
            title: "Title"

        `;

        const markup = dd`
        > ::: page-constructor
        > blocks:
        >   - type: "header-block"
        >     title: "Title"
        > :::
        `;

        same(
            markup,
            doc(
                quote(
                    yfmPageConstructor({
                        [YfmPageConstructorAttrs.content]: content,
                        [YfmPageConstructorAttrs.EntityId]: `${yfmPageConstructorNodeName}-eff-000-0ab`,
                    }),
                ),
            ),
        );
    });
});

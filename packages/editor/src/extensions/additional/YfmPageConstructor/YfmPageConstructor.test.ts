import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs, BlockquoteSpecs, blockquoteNodeName} from '../../specs';

import {YfmPageConstructorSpecs} from './YfmPageConstructorSpecs';
import {YfmPageConstructorAttrs, yfmPageConstructorNodeName} from './const';

jest.mock<{v4: () => string}>('uuid', () => ({
    v4: jest.fn().mockReturnValue('eff-000-0ab'),
}));

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

        // No trailing blank line → no trailing \n (matches serializer output without ensureNewLine)
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

        // No trailing blank line → no trailing \n (serializer doesn't add one here)
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

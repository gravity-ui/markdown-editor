import type {Parser, Serializer} from '@gravity-ui/markdown-editor';
import {
    BaseNode,
    BaseSchemaSpecs,
    BlockquoteSpecs,
    ExtensionsManager,
    blockquoteNodeName,
} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import dd from 'ts-dedent';
import {describe, expect, it, vi} from 'vitest';

import {MermaidSpecsExtension} from './MermaidSpecs';
import {MermaidAttrs, mermaidNodeName} from './MermaidSpecs/const';

vi.mock(import('@gravity-ui/markdown-editor'), async (importOriginal) => {
    const actual = await importOriginal();
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
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(MermaidSpecsExtension, {}),
}).buildDeps();

const {doc, mermaid, quote} = builders<'doc' | 'mermaid' | 'quote'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    mermaid: {nodeType: mermaidNodeName},
    quote: {nodeType: blockquoteNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Mermaid extension', () => {
    it('should parse mermaid', () =>
        same(
            '```mermaid\ncontent\n```\n',
            doc(
                mermaid({
                    [MermaidAttrs.content]: 'content\n',
                    [MermaidAttrs.EntityId]: 'mermaid-eff-000-0ab',
                }),
            ),
        ));

    it('should parse mermaid inside blockqoute', () => {
        const mermaidContent = dd`
        sequenceDiagram
          Alice->>Bob: Hi Bob
          Bob->>Alice: Hi Alice

        `;

        const markup = dd`
        > \`\`\`mermaid
        > sequenceDiagram
        >   Alice->>Bob: Hi Bob
        >   Bob->>Alice: Hi Alice
        > \`\`\`

        `;

        same(
            markup,
            doc(
                quote(
                    mermaid({
                        [MermaidAttrs.content]: mermaidContent,
                        [MermaidAttrs.EntityId]: 'mermaid-eff-000-0ab',
                    }),
                ),
            ),
        );
    });
});

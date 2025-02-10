import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs, BlockquoteSpecs, blockquoteNodeName} from '../../specs';

import {MermaidSpecs} from './MermaidSpecs';
import {MermaidAttrs, mermaidNodeName} from './const';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(MermaidSpecs, {}),
}).buildDeps();

const {doc, mermaid, quote} = builders<'doc' | 'mermaid' | 'quote'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    mermaid: {nodeType: mermaidNodeName},
    quote: {nodeType: blockquoteNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Mermaid extension', () => {
    it('should parse mermaid', () =>
        same('```mermaid\ncontent\n```\n', doc(mermaid({[MermaidAttrs.content]: 'content\n'}))));

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

        same(markup, doc(quote(mermaid({[MermaidAttrs.content]: mermaidContent}))));
    });
});

import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../specs';

import {MermaidSpecs} from './MermaidSpecs';
import {MermaidAttrs, mermaidNodeName} from './const';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(MermaidSpecs, {}),
}).buildDeps();

const {doc, mermaid} = builders<'doc' | 'mermaid'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    mermaid: {nodeType: mermaidNodeName},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Mermaid extension', () => {
    it('should parse mermaid', () =>
        same('```mermaid\ncontent\n```\n', doc(mermaid({[MermaidAttrs.content]: 'content\n'}))));
});

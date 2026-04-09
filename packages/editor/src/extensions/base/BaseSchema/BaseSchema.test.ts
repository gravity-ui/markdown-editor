import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/Blockquote/BlockquoteSpecs';

import {BaseNode, BaseSchemaSpecs} from './BaseSchemaSpecs';

describe('BaseSchema extension', () => {
    describe('common', () => {
        const {
            schema,
            markupParser: parser,
            serializer,
        } = new ExtensionsManager({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
        }).buildDeps();

        const {doc, p} = builders<'doc' | 'p'>(schema, {
            doc: {nodeType: BaseNode.Doc},
            p: {nodeType: BaseNode.Paragraph},
        });

        const {same} = createMarkupChecker({parser, serializer});

        it('should parse a paragraph', () => same('hello!', doc(p('hello!'))));

        it('should parse a few paragraphs', () => {
            same(['hello', '', 'world!'].join('\n'), doc(p('hello'), p('world!')));
        });
    });

    describe('preserveEmptyRows=true', () => {
        const {
            schema,
            markupParser: parser,
            serializer,
        } = new ExtensionsManager({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {preserveEmptyRows: true}).use(BlockquoteSpecs),
        }).buildDeps();

        const {doc, p, bq} = builders<'doc' | 'p' | 'bq'>(schema, {
            doc: {nodeType: BaseNode.Doc},
            p: {nodeType: BaseNode.Paragraph},
            bq: {nodeType: blockquoteNodeName},
        });

        const {same} = createMarkupChecker({parser, serializer});

        it('should serialize empty paragraph as &nbsp;', () =>
            same(
                'hello!\n\n&nbsp;\n\nworld!',
                doc(p('hello!'), p(String.fromCharCode(160 /* &nbsp; */)), p('world!')),
            ));

        it('should correct insert &nbsp; inside other nodes', () =>
            same(
                '> hello!\n>\n> &nbsp;\n> \n> world!',
                doc(bq(p('hello!'), p(String.fromCharCode(160 /* &nbsp; */)), p('world!'))),
            ));

        it('should preserve empty rows when only content paragraph changes', () => {
            const emptyP1 = p();
            const emptyP2 = p();
            const emptyP3 = p();
            const emptyP4 = p();

            const doc1 = doc(emptyP1, emptyP2, p('aaa'), emptyP3, emptyP4);
            const doc2 = doc(emptyP1, emptyP2, p('bbb'), emptyP3, emptyP4);

            const result1 = serializer.serialize(doc1);
            const result2 = serializer.serialize(doc2);

            expect(result1).toBe('&nbsp;\n\n&nbsp;\n\naaa\n\n&nbsp;\n\n&nbsp;\n\n');
            expect(result2).toBe('&nbsp;\n\n&nbsp;\n\nbbb\n\n&nbsp;\n\n&nbsp;\n\n');
        });

        it('should handle transition from all-empty doc to doc with content', () => {
            const emptyP = p();

            // First: only empty paragraphs — isParentEmpty=true, nothing serialized
            const doc1 = doc(emptyP, emptyP);
            const result1 = serializer.serialize(doc1);
            expect(result1).toBe('');

            // Second: add content paragraph + more empty ones (same emptyP reused)
            const doc2 = doc(emptyP, emptyP, p('a'), emptyP, emptyP);
            const result2 = serializer.serialize(doc2);
            expect(result2).toBe('&nbsp;\n\n&nbsp;\n\na\n\n&nbsp;\n\n&nbsp;\n\n');
        });
    });
});

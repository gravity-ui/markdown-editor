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
    });
});

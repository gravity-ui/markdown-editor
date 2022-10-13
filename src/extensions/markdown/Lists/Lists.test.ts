import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {ListNode} from './const';
import {Lists} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Lists, {}),
}).buildDeps();

const {doc, p, li, ul, ol} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    li: {nodeType: ListNode.ListItem},
    ul: {nodeType: ListNode.BulletList},
    ol: {nodeType: ListNode.OrderedList},
}) as PMTestBuilderResult<'doc' | 'p' | 'li' | 'ul' | 'ol'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Lists extension', () => {
    it('should parse bullet list', () => {
        same('* one\n\n* two', doc(ul(li(p('one')), li(p('two')))));
    });

    it('should parse ordered list', () => {
        same('1. one\n\n2. two', doc(ol(li(p('one')), li(p('two')))));
    });

    it('should parse nested lists', () => {
        const markup = `
* one

  1. two

     * three

  2. four

* five
        `.trim();

        same(
            markup,
            doc(
                ul(
                    li(p('one'), ol(li(p('two'), ul(li(p('three')))), li(p('four')))),
                    li(p('five')),
                ),
            ),
        );
    });
});

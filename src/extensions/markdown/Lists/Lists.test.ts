import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {ListNode, ListsAttr, ListsSpecs} from './ListsSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ListsSpecs),
}).buildDeps();

const {doc, p, li, ul, ol} = builders<'doc' | 'p' | 'li' | 'ul' | 'ol'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    li: {nodeType: ListNode.ListItem},
    ul: {nodeType: ListNode.BulletList},
    ol: {nodeType: ListNode.OrderedList},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Lists extension', () => {
    it('should parse bullet list', () => {
        same(
            '* one\n\n* two',
            doc(
                ul(
                    {[ListsAttr.Markup]: '*'},
                    li({[ListsAttr.Markup]: '*'}, p('one')),
                    li({[ListsAttr.Markup]: '*'}, p('two')),
                ),
            ),
        );
    });

    it('should parse ordered list with dots', () => {
        same(
            '1. one\n\n2. two',
            doc(
                ol(
                    li({[ListsAttr.Markup]: '.'}, p('one')),
                    li({[ListsAttr.Markup]: '.'}, p('two')),
                ),
            ),
        );
    });

    it('should parse ordered list with parenthesis', () => {
        same(
            '1) one\n\n2) two',
            doc(
                ol(
                    {[ListsAttr.Markup]: ')'},
                    li({[ListsAttr.Markup]: ')'}, p('one')),
                    li({[ListsAttr.Markup]: ')'}, p('two')),
                ),
            ),
        );
    });

    it('should parse nested lists', () => {
        const markup = `
- one

  1. two

     + three

  2. four

- five
        `.trim();

        same(
            markup,
            doc(
                ul(
                    {[ListsAttr.Bullet]: '-', [ListsAttr.Markup]: '-'},
                    li(
                        {[ListsAttr.Markup]: '-'},
                        p('one'),
                        ol(
                            li(
                                {[ListsAttr.Markup]: '.'},
                                p('two'),
                                ul(
                                    {
                                        [ListsAttr.Tight]: true,
                                        [ListsAttr.Bullet]: '+',
                                        [ListsAttr.Markup]: '+',
                                    },
                                    li({[ListsAttr.Markup]: '+'}, p('three')),
                                ),
                            ),
                            li({[ListsAttr.Markup]: '.'}, p('four')),
                        ),
                    ),
                    li({[ListsAttr.Markup]: '-'}, p('five')),
                ),
            ),
        );
    });

    it('should parse nested lists 2', () => {
        same(
            '- + * 2. item',
            doc(
                ul(
                    {[ListsAttr.Bullet]: '-', [ListsAttr.Markup]: '-'},
                    li(
                        {[ListsAttr.Markup]: '-'},
                        ul(
                            {[ListsAttr.Bullet]: '+', [ListsAttr.Markup]: '+'},
                            li(
                                {[ListsAttr.Markup]: '+'},
                                ul(
                                    {[ListsAttr.Bullet]: '*', [ListsAttr.Markup]: '*'},
                                    li(
                                        {[ListsAttr.Markup]: '*'},
                                        ol(
                                            {
                                                [ListsAttr.Order]: 2,
                                                [ListsAttr.Tight]: true,
                                                [ListsAttr.Markup]: '.',
                                            },
                                            li({[ListsAttr.Markup]: '.'}, p('item')),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        );
    });
});

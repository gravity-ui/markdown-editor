import {builders} from 'prosemirror-test-builder';
import {describe, it} from 'vitest';

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

const {same, serialize} = createMarkupChecker({parser, serializer});

describe('Lists extension', () => {
    it.each([
        {marker: '.', markup: '0. one\n1. two'},
        {marker: ')', markup: '0) one\n1) two'},
    ])('should serialize an ordered list starting at zero with $marker', ({marker, markup}) => {
        serialize(
            doc(ol({[ListsAttr.Order]: 0, [ListsAttr.Markup]: marker}, li(p('one')), li(p('two')))),
            markup,
        );
    });

    it.each([
        {order: 1, marker: '.', markup: '1. one\n2. two'},
        {order: 1, marker: ')', markup: '1) one\n2) two'},
        {order: 3, marker: '.', markup: '3. one\n4. two'},
        {order: 3, marker: ')', markup: '3) one\n4) two'},
        {order: 9, marker: '.', markup: ' 9. one\n10. two'},
        {order: 9, marker: ')', markup: ' 9) one\n10) two'},
    ])(
        'should preserve ordered list numbering from $order with $marker',
        ({order, marker, markup}) => {
            serialize(
                doc(
                    ol(
                        {[ListsAttr.Order]: order, [ListsAttr.Markup]: marker},
                        li(p('one')),
                        li(p('two')),
                    ),
                ),
                markup,
            );
        },
    );

    it('should parse bullet list (tight)', () => {
        same(
            '* one\n* two',
            doc(
                ul(
                    {[ListsAttr.Markup]: '*'},
                    li({[ListsAttr.Markup]: '*'}, p('one')),
                    li({[ListsAttr.Markup]: '*'}, p('two')),
                ),
            ),
        );
    });

    it('should parse bullet list (non tight)', () => {
        same(
            '* one\n\n* two',
            doc(
                ul(
                    {[ListsAttr.Markup]: '*', [ListsAttr.Tight]: false},
                    li({[ListsAttr.Markup]: '*'}, p('one')),
                    li({[ListsAttr.Markup]: '*'}, p('two')),
                ),
            ),
        );
    });

    it('should parse ordered list with dots (tight)', () => {
        same(
            '1. one\n2. two',
            doc(
                ol(
                    li({[ListsAttr.Markup]: '.'}, p('one')),
                    li({[ListsAttr.Markup]: '.'}, p('two')),
                ),
            ),
        );
    });

    it('should parse ordered list with dots (non tight)', () => {
        same(
            '1. one\n\n2. two',
            doc(
                ol(
                    {[ListsAttr.Tight]: false},
                    li({[ListsAttr.Markup]: '.'}, p('one')),
                    li({[ListsAttr.Markup]: '.'}, p('two')),
                ),
            ),
        );
    });

    it('should parse ordered list with parenthesis (tight)', () => {
        same(
            '1) one\n2) two',
            doc(
                ol(
                    {[ListsAttr.Markup]: ')'},
                    li({[ListsAttr.Markup]: ')'}, p('one')),
                    li({[ListsAttr.Markup]: ')'}, p('two')),
                ),
            ),
        );
    });

    it('should parse ordered list with parenthesis (non tight)', () => {
        same(
            '1) one\n\n2) two',
            doc(
                ol(
                    {[ListsAttr.Markup]: ')', [ListsAttr.Tight]: false},
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
                    {[ListsAttr.Markup]: '-', [ListsAttr.Tight]: false},
                    li(
                        {[ListsAttr.Markup]: '-'},
                        p('one'),
                        ol(
                            {[ListsAttr.Tight]: false},
                            li(
                                {[ListsAttr.Markup]: '.'},
                                p('two'),
                                ul(
                                    {
                                        [ListsAttr.Tight]: true,
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
                    {[ListsAttr.Markup]: '-', [ListsAttr.Tight]: false},
                    li(
                        {[ListsAttr.Markup]: '-'},
                        ul(
                            {[ListsAttr.Markup]: '+', [ListsAttr.Tight]: false},
                            li(
                                {[ListsAttr.Markup]: '+'},
                                ul(
                                    {[ListsAttr.Markup]: '*', [ListsAttr.Tight]: false},
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

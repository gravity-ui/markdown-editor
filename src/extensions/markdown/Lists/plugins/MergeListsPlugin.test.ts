import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/specs';
import {CodeSpecs, codeMarkName} from '../../Code/CodeSpecs';
import {ListNode, ListsAttr, ListsSpecs} from '../ListsSpecs';

import {mergeListsPlugin} from './MergeListsPlugin';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ListsSpecs).use(CodeSpecs),
}).buildDeps();

const {doc, p, li, ul, c, ol} = builders<'doc' | 'p' | 'li' | 'ul' | 'ol', 'c'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    li: {nodeType: ListNode.ListItem},
    ul: {nodeType: ListNode.BulletList},
    ol: {nodeType: ListNode.OrderedList},
    c: {nodeType: codeMarkName},
});

const nestedListsMarkup = `
+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
- Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
* Very easy!
`;

const orderedListMarkup = `
1. Create a list by starting a line with \`+\`, \`-\`, or \`*\`
2. Sub-lists are made by indenting 2 spaces:
    1. Marker character change forces new list start:
    2. Ac tristique libero volutpat at
    3. Facilisis in pretium nisl aliquet
    4. Nulla volutpat aliquam velit

1. Very easy!
2. Very easy!
`;

describe('Lists extension', () => {
    describe('MergeListsPlugin', () => {
        it('should merge bullet lists', () => {
            const view = new EditorView(null, {
                state: EditorState.create({schema, plugins: [mergeListsPlugin()]}),
            });
            view.dispatch(
                view.state.tr.replaceWith(
                    0,
                    view.state.doc.nodeSize - 2,
                    markupParser.parse(nestedListsMarkup).content,
                ),
            );
            expect(view.state.doc).toMatchNode(
                doc(
                    ul(
                        {
                            [ListsAttr.Tight]: true,
                            [ListsAttr.Markup]: '+',
                        },
                        li(
                            {[ListsAttr.Markup]: '+'},
                            p(
                                'Create a list by starting a line with ',
                                c('+'),
                                ', ',
                                c('-'),
                                ', or ',
                                c('*'),
                            ),
                        ),
                        li(
                            {[ListsAttr.Markup]: '-'},
                            p('Sub-lists are made by indenting 2 spaces:'),
                            ul(
                                {
                                    [ListsAttr.Tight]: true,
                                    [ListsAttr.Markup]: '-',
                                },
                                li(
                                    {[ListsAttr.Markup]: '-'},
                                    p('Marker character change forces new list start:'),
                                ),
                                li({[ListsAttr.Markup]: '*'}, p('Ac tristique libero volutpat at')),
                                li(
                                    {[ListsAttr.Markup]: '+'},
                                    p('Facilisis in pretium nisl aliquet'),
                                ),
                                li({[ListsAttr.Markup]: '-'}, p('Nulla volutpat aliquam velit')),
                            ),
                        ),
                        li({[ListsAttr.Markup]: '*'}, p('Very easy!')),
                    ),
                ),
            );
        });

        it('should merge ordered lists', () => {
            const view = new EditorView(null, {
                state: EditorState.create({schema, plugins: [mergeListsPlugin()]}),
            });
            view.dispatch(
                view.state.tr.replaceWith(
                    0,
                    view.state.doc.nodeSize - 2,
                    markupParser.parse(orderedListMarkup).content,
                ),
            );
            expect(view.state.doc).toMatchNode(
                doc(
                    ol(
                        {
                            [ListsAttr.Markup]: '.',
                        },
                        li(
                            {
                                [ListsAttr.Markup]: '.',
                            },
                            p(
                                'Create a list by starting a line with ',
                                c('+'),
                                ', ',
                                c('-'),
                                ', or ',
                                c('*'),
                            ),
                        ),
                        li(
                            {
                                [ListsAttr.Markup]: '.',
                            },
                            p('Sub-lists are made by indenting 2 spaces:'),
                            ol(
                                {
                                    [ListsAttr.Tight]: true,
                                    [ListsAttr.Markup]: '.',
                                },
                                li(
                                    {[ListsAttr.Markup]: '.'},
                                    p('Marker character change forces new list start:'),
                                ),
                                li({[ListsAttr.Markup]: '.'}, p('Ac tristique libero volutpat at')),
                                li(
                                    {[ListsAttr.Markup]: '.'},
                                    p('Facilisis in pretium nisl aliquet'),
                                ),
                                li({[ListsAttr.Markup]: '.'}, p('Nulla volutpat aliquam velit')),
                            ),
                        ),
                        li({[ListsAttr.Markup]: '.'}, p('Very easy!')),
                        li({[ListsAttr.Markup]: '.'}, p('Very easy!')),
                    ),
                ),
            );
        });
    });
});

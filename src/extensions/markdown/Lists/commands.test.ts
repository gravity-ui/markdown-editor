// eslint-disable-next-line import/no-extraneous-dependencies
import {Schema} from 'prosemirror-model';
import {builders, li, ul} from 'prosemirror-test-builder';

import {
    getListItemsToTransform,
    sinkOnlySelectedListItem,
} from 'src/extensions/markdown/Lists/commands';
import {apply, assertMapEntries, getParams} from 'src/extensions/markdown/Lists/testUtils';
import {getSchemaSpecs as getYfmNoteSchemaSpecs} from 'src/extensions/yfm/YfmNote/YfmNoteSpecs/schema';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {
            group: 'block',
            content: 'inline*',
            toDOM: () => ['p', 0],
        },
        ...getYfmNoteSchemaSpecs(),
    },
});

const {
    doc,
    paragraph: p,
    yfm_note: note,
    yfm_note_title: noteTitle,
    yfm_note_content: noteContent,
} = builders(schema);

describe('sinkOnlySelectedListItem', () => {
    const sink = sinkOnlySelectedListItem(schema.nodes.list_item);

    it('can wrap a simple item in a list', () =>
        apply(
            doc(ul(li(p('one')), li(p('t<a><b>wo')), li(p('three')))),
            sink,
            doc(ul(li(p('one'), ul(li(p('two')))), li(p('three')))),
        ));

    it("won't wrap the first item in a sublist", () =>
        apply(doc(ul(li(p('o<a><b>ne')), li(p('two')), li(p('three')))), sink, null));

    it("will move an item's content into the item above", () =>
        apply(
            doc(ul(li(p('one')), li(p('...'), ul(li(p('two')))), li(p('t<a><b>hree')))),
            sink,
            doc(ul(li(p('one')), li(p('...'), ul(li(p('two')), li(p('three')))))),
        ));

    it('transforms a complex nested list with selection markers', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('b<a>b'),
                        ul(
                            li(p('c<b>c')),
                            li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
            sink,
            doc(
                ul(
                    li(
                        p('aa'),
                        ul(
                            li(p('bb'), ul(li(p('cc')))),
                            li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('sinks a top-level list item with double selection markers into the previous item', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('b<a><b>b'),
                        ul(
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
            sink,
            doc(
                ul(
                    li(
                        p('aa'),
                        ul(
                            li(p('bb')),
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('sinks nested list items into a deeper hierarchy when selection spans multiple items', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('d<a>d'), ul(li(p('ee')), li(p('ss')))),
                            li(p('z<b>z')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
            sink,
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc'), ul(li(p('dd'), ul(li(p('ee')), li(p('ss')))), li(p('zz')))),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    // expected result should be the same as
    // sinks nested list items into a deeper hierarchy when selection spans multiple items
    it('sinks nested list items with an upward staircase selection', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee')), li(p('s<a>s')))),
                            li(p('z<b>z')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
            sink,
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc'), ul(li(p('dd'), ul(li(p('ee')), li(p('ss')))), li(p('zz')))),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('sinks a top-level list item with mixed selection markers from both levels', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('b<a>b'),
                        ul(
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee')), li(p('s<b>s')))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
            sink,
            doc(
                ul(
                    li(
                        p('aa'),
                        ul(
                            li(p('bb'), ul(li(p('cc')), li(p('dd'), ul(li(p('ee')), li(p('ss')))))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));
    it('sinks nested list items with a reverse staircase selection from outdented item to indented one', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee')), li(p('s<a>s')))),
                            li(p('z<b>z')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
            sink,
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee'), ul(li(p('ss')))), li(p('zz')))),
                            li(p('ww')),
                        ),
                    ),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('removes selection markers without changing list structure for first item', () =>
        apply(
            doc(ul(li(p('1<a><b>1')), li(p('22')), li(p('33')))),
            sink,
            doc(ul(li(p('11')), li(p('22')), li(p('33')))),
        ));

    it('indents the second item into a sublist when selected', () =>
        apply(
            doc(ul(li(p('11')), li(p('2<a><b>2')), li(p('33')))),
            sink,
            doc(ul(li(p('11'), ul(li(p('22')))), li(p('33')))),
        ));

    it('indents only the selected item when selection spans two items', () =>
        apply(
            doc(ul(li(p('11')), li(p('2<a>2')), li(p('3<b>3')))),
            sink,
            doc(ul(li(p('11'), ul(li(p('22')))), li(p('33')))),
        ));
});

describe('getListItemsToTransform (using getParams helper)', () => {
    it('1', () => {
        const testDoc = doc(ul(li(p('11')), li(p('2<a><b>2')), li(p('33'))));

        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [[7, 13]]);
    });

    it('2', () => {
        const testDoc = doc(ul(li(p('11')), li(p('2<a>2')), li(p('3<b>3'))));

        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [
            [7, 13],
            [13, 19],
        ]);
    });

    it('3', () => {
        const testDoc = doc(ul(li(p('11')), li(p('2<a>2'), ul(li(p('3<b>3'))))));
        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [
            [7, 21],
            [13, 19],
        ]);
    });

    it('4', () => {
        const testDoc = doc(ul(li(p('11')), li(p('2<a>2'), ul(li(p('33')))), li(p('4<b>4'))));
        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [
            [7, 21],
            [13, 19],
            [21, 27],
        ]);
    });

    it('5', () => {
        const testDoc = doc(ul(li(p('11'), ul(li(p('22')), li(p('3<a>3')))), li(p('4<b>4'))));
        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [
            [13, 19],
            [21, 27],
        ]);
    });

    it('6', () => {
        const testDoc = doc(
            ul(
                li(p('11')),
                li(p('2<a>2'), ul(li(p('33'), ul(li(p('44')))), li(p('55')))),
                li(p('6<b>6')),
            ),
        );

        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [
            [7, 35],
            [13, 27],
            [19, 25],
            [27, 33],
            [35, 41],
        ]);
    });

    it('7', () => {
        const testDoc = doc(
            ul(
                li(p('11')),
                li(
                    p('2<a>2'),
                    note(noteTitle('Note'), noteContent(ul(li(p('33')), li(p('44')), li(p('55'))))),
                ),
                li(p('6<b>6')),
            ),
        );

        const resultMap = getListItemsToTransform(...getParams(testDoc));

        assertMapEntries(resultMap, [
            [7, 43],
            [43, 49],
            [21, 27],
            [27, 33],
            [33, 39],
        ]);
    });
});

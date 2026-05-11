import ist from 'ist';
import {history, undo} from 'prosemirror-history';
import type {Node} from 'prosemirror-model';
import {
    type Command,
    EditorState,
    NodeSelection,
    type Plugin,
    Selection,
    TextSelection,
} from 'prosemirror-state';
import {doc, eq, li, p, schema, ul} from 'prosemirror-test-builder';

import {
    getSelectedListBlocks,
    liftSelectedListItems,
    sinkSelectedListItems,
} from 'src/extensions/markdown/Lists/commands';

type TaggedNode = Node & {
    tag: {
        a: number | null;
        b: number | null;
    };
};

function selFor(docNode: Node) {
    const taggedNode = docNode as TaggedNode;
    const a = taggedNode.tag.a;
    const b = taggedNode.tag.b;

    if (a === null) {
        return Selection.atStart(docNode);
    }

    const $a = docNode.resolve(a);

    if ($a.parent.inlineContent) {
        const $b = b === null ? undefined : docNode.resolve(b);

        return new TextSelection($a, $b);
    }

    return new NodeSelection($a);
}

function createState(docNode: Node, plugins: Plugin[] = []) {
    return EditorState.create({doc: docNode, selection: selFor(docNode), plugins});
}

function runCommand(docNode: Node, command: Command, plugins: Plugin[] = []) {
    let state = createState(docNode, plugins);
    let dispatchCount = 0;

    const handled = command(state, (tr) => {
        dispatchCount += 1;
        state = state.apply(tr);
    });

    return {dispatchCount, handled, state};
}

function apply(docNode: Node, command: Command, result: Node | null) {
    const {state} = runCommand(docNode, command);

    ist(state.doc, result || docNode, eq);

    if (
        result &&
        (result as TaggedNode).tag.a !== null &&
        (result as TaggedNode).tag.a !== undefined
    ) {
        ist(state.selection, selFor(result), eq);
    }
}

function getBlockTexts(docNode: Node) {
    const state = createState(docNode);

    return getSelectedListBlocks(state.selection, schema.nodes.list_item).map((block) => {
        const range = docNode
            .resolve(block.from)
            .blockRange(
                docNode.resolve(block.to),
                (node) =>
                    node.childCount > 0 &&
                    node.firstChild !== null &&
                    node.firstChild.type === schema.nodes.list_item,
            );

        if (!range) {
            throw new Error('Expected a list block range');
        }

        const texts: string[] = [];

        for (let index = range.startIndex; index < range.endIndex; index++) {
            const item = range.parent.child(index);
            texts.push(item.firstChild?.textContent ?? item.textContent);
        }

        return texts;
    });
}

describe('getSelectedListBlocks', () => {
    it('collects a simple selected list item', () => {
        expect(getBlockTexts(doc(ul(li(p('11')), li(p('2<a><b>2')), li(p('33')))))).toEqual([
            ['22'],
        ]);
    });

    it('collects downward staircase selections as separate list-level blocks', () => {
        expect(
            getBlockTexts(
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
            ),
        ).toEqual([['bb'], ['cc']]);
    });

    it('collects reverse staircase selections from inner to outer items', () => {
        expect(
            getBlockTexts(
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
            ),
        ).toEqual([['ss'], ['zz']]);
    });

    it('groups mixed multi-level selections into contiguous sibling runs', () => {
        expect(
            getBlockTexts(
                doc(
                    ul(
                        li(p('aa')),
                        li(
                            p('b<a>b'),
                            ul(
                                li(p('cc')),
                                li(p('dd'), ul(li(p('e<b>e')), li(p('ss')))),
                                li(p('zz')),
                                li(p('ww')),
                            ),
                        ),
                        li(p('pp')),
                        li(p('hh')),
                    ),
                ),
            ),
        ).toEqual([['bb'], ['cc', 'dd'], ['ee', 'ss']]);
    });
});

describe('sinkSelectedListItems', () => {
    const sink = sinkSelectedListItems(schema.nodes.list_item);

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

    it('sinks reverse staircase selections from the innermost item outward', () =>
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
});

describe('liftSelectedListItems', () => {
    const lift = liftSelectedListItems(schema.nodes.list_item);

    it('lifts a top-level list item into a paragraph', () =>
        apply(
            doc(ul(li(p('first')), li(p('s<a><b>econd'))), p('text')),
            lift,
            doc(ul(li(p('first'))), p('second'), p('text')),
        ));

    it('lifts a nested list item out by one level', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('t<a><b>wo')))))),
            lift,
            doc(ul(li(p('one')), li(p('two')))),
        ));

    it('keeps the original selection when lifting reverse staircase blocks', () =>
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
            lift,
            doc(
                ul(
                    li(p('aa')),
                    li(p('bb'), ul(li(p('cc')), li(p('dd'), ul(li(p('ee')))), li(p('s<a>s')))),
                    li(p('z<b>z'), ul(li(p('ww')))),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('undoes a multi-block lift in a single history step', () => {
        const docNode = doc(
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
        );

        let state = createState(docNode, [history()]);

        lift(state, (tr) => {
            state = state.apply(tr);
        });

        expect(
            undo(state, (tr) => {
                state = state.apply(tr);
            }),
        ).toBe(true);

        ist(state.doc, docNode, eq);
        ist(state.selection, selFor(docNode), eq);
    });
});

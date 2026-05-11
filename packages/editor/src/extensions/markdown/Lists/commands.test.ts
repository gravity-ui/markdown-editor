import ist from 'ist';
import type {Node} from 'prosemirror-model';
import {
    type Command,
    EditorState,
    NodeSelection,
    Selection,
    TextSelection,
} from 'prosemirror-state';
import {doc, eq, li, p, schema, ul} from 'prosemirror-test-builder';

import {
    liftSelectedListItems,
    sinkOnlySelectedListItem,
} from 'src/extensions/markdown/Lists/commands';

function selFor(docNode: Node) {
    const a = (docNode as any).tag.a,
        b = (docNode as any).tag.b;
    if (a !== null) {
        const $a = docNode.resolve(a);
        if ($a.parent.inlineContent)
            return new TextSelection($a, b !== null ? docNode.resolve(b) : undefined);
        else return new NodeSelection($a);
    }
    return Selection.atStart(docNode);
}

function apply(docNode: Node, command: Command, result: Node | null) {
    let state = EditorState.create({doc: docNode, selection: selFor(docNode)});
    // eslint-disable-next-line no-return-assign
    command(state, (tr) => (state = state.apply(tr)));
    ist(state.doc, result || docNode, eq);
    // eslint-disable-next-line no-eq-null
    if (result && (result as any).tag.a != null) ist(state.selection, selFor(result), eq);
}

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
});

describe('liftSelectedListItems', () => {
    const lift = liftSelectedListItems(schema.nodes.list_item);

    it('lifts a nested list item out by one level', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('t<a><b>wo')))))),
            lift,
            doc(ul(li(p('one')), li(p('two')))),
        ));

    it('lifts reverse staircase selections with standard list-item semantics', () =>
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
                    li(p('bb'), ul(li(p('cc')), li(p('dd'), ul(li(p('ee')))), li(p('ss')))),
                    li(p('zz'), ul(li(p('ww')))),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));
});

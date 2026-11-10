import ist from 'ist';
import type {Node} from 'prosemirror-model';
import {liftListItem} from 'prosemirror-schema-list';
import {
    type Command,
    EditorState,
    NodeSelection,
    Selection,
    TextSelection,
} from 'prosemirror-state';
import {blockquote, doc, eq, li, ol, p, schema, ul} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {liftSelectedListItems, sinkSelectedListItems} from 'src/extensions/markdown/Lists/commands';
import {mergeListsPlugin} from 'src/extensions/markdown/Lists/plugins/MergeListsPlugin';

function selFor(doc: Node) {
    const a = (doc as any).tag.a,
        b = (doc as any).tag.b;
    if (a !== null) {
        const $a = doc.resolve(a);
        if ($a.parent.inlineContent)
            return new TextSelection($a, b !== null ? doc.resolve(b) : undefined);
        else return new NodeSelection($a);
    }
    return Selection.atStart(doc);
}

function apply(doc: Node, command: Command, result: Node | null) {
    let state = EditorState.create({doc, selection: selFor(doc)});
    // eslint-disable-next-line no-return-assign
    command(state, (tr) => (state = state.apply(tr)));
    ist(state.doc, result || doc, eq);
    // eslint-disable-next-line no-eq-null
    if (result && (result as any).tag.a != null) ist(state.selection, selFor(result), eq);
}

const sink = sinkSelectedListItems(schema.nodes.list_item);
const lift = liftSelectedListItems(schema.nodes.list_item);

describe('sinkSelectedListItems', () => {
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

    it('should sink only the selected items when the selection starts at a deeper level', () =>
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
                            li(p('dd'), ul(li(p('ee'), ul(li(p('s<a>s')))), li(p('z<b>z')))),
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

    it('should sink the items when the level changes several times inside the selection', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('d<a>d'), ul(li(p('ee')), li(p('ss')))),
                            li(p('zz')),
                            li(p('ww')),
                        ),
                    ),
                    li(p('p<b>p')),
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
                            li(
                                p('cc'),
                                ul(
                                    li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                                    li(p('zz')),
                                    li(p('ww')),
                                ),
                            ),
                            li(p('pp')),
                        ),
                    ),
                    li(p('hh')),
                ),
            ),
        ));

    it('should leave the first item of a list in place and sink the other selected items', () =>
        apply(
            doc(ul(li(p('o<a>ne')), li(p('two')), li(p('thr<b>ee')))),
            sink,
            doc(ul(li(p('o<a>ne'), ul(li(p('two')), li(p('thr<b>ee')))))),
        ));

    it('should not sink when no selected item has a previous sibling', () =>
        apply(doc(ul(li(p('o<a>ne'), ul(li(p('t<b>wo')))), li(p('three')))), sink, null));

    it('should not sink the item that starts at the end of the selection', () =>
        apply(
            doc(ul(li(p('one')), li(p('<a>two')), li(p('<b>three')))),
            sink,
            doc(ul(li(p('one'), ul(li(p('two')))), li(p('three')))),
        ));

    it('should sink the selected items of each list', () =>
        apply(
            doc(ul(li(p('one')), li(p('t<a>wo'))), p('text'), ul(li(p('three')), li(p('fo<b>ur')))),
            sink,
            doc(
                ul(li(p('one'), ul(li(p('two'))))),
                p('text'),
                ul(li(p('three'), ul(li(p('four'))))),
            ),
        ));

    it('should sink a selected item node together with its nested items', () =>
        apply(
            doc(ul(li(p('one')), '<a>', li(p('two'), ul(li(p('three')))))),
            sink,
            doc(ul(li(p('one'), ul(li(p('two'), ul(li(p('three')))))))),
        ));

    it('should sink an item of a list inside a block of another item', () =>
        apply(
            doc(ul(li(p('one'), blockquote(ul(li(p('two')), li(p('th<a><b>ree'))))))),
            sink,
            doc(ul(li(p('one'), blockquote(ul(li(p('two'), ul(li(p('three'))))))))),
        ));

    it('should sink an item together with a list inside its block', () =>
        apply(
            doc(ul(li(p('one')), li(p('t<a><b>wo'), blockquote(ul(li(p('three'))))))),
            sink,
            doc(ul(li(p('one'), ul(li(p('two'), blockquote(ul(li(p('three'))))))))),
        ));

    it('should keep the type of the nested list of the previous item', () =>
        apply(
            doc(ul(li(p('one'), ol(li(p('two')))), li(p('th<a>ree')), li(p('fo<b>ur')))),
            sink,
            doc(ul(li(p('one'), ol(li(p('two'))), ul(li(p('three')), li(p('four')))))),
        ));

    it('should sink several groups of items in one transaction', () => {
        const initial = doc(
            ul(li(p('one'), ul(li(p('two')), li(p('th<a>ree')))), li(p('fo<b>ur'))),
        );
        const state = EditorState.create({doc: initial, selection: selFor(initial)});
        let dispatched = 0;
        sink(state, () => dispatched++);
        expect(dispatched).toBe(1);
    });
});

describe('liftSelectedListItems', () => {
    it('should lift a nested item and nest its following siblings in it', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('t<a><b>wo')), li(p('three')))))),
            lift,
            doc(ul(li(p('one')), li(p('t<a><b>wo'), ul(li(p('three')))))),
        ));

    it('should lift a top-level item out of the list', () =>
        apply(
            doc(ul(li(p('one')), li(p('t<a><b>wo')), li(p('three')))),
            lift,
            doc(ul(li(p('one'))), p('t<a><b>wo'), ul(li(p('three')))),
        ));

    it('should lift an item together with its nested items', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('t<a><b>wo'), ul(li(p('three')))))))),
            lift,
            doc(ul(li(p('one')), li(p('two'), ul(li(p('three')))))),
        ));

    it('should lift the selected items of one level', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                            li(p('z<a>z')),
                            li(p('w<b>w')),
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
                    li(p('bb'), ul(li(p('cc')), li(p('dd'), ul(li(p('ee')), li(p('ss')))))),
                    li(p('z<a>z')),
                    li(p('w<b>w')),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('should lift the items when the selection goes from an outer level to a deeper one', () =>
        apply(
            doc(
                ul(
                    li(p('aa')),
                    li(
                        p('bb'),
                        ul(
                            li(p('cc')),
                            li(p('d<a>d'), ul(li(p('e<b>e')), li(p('ss')))),
                            li(p('zz')),
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
                    li(p('bb'), ul(li(p('cc')))),
                    li(p('dd'), ul(li(p('ee'), ul(li(p('ss')))), li(p('zz')), li(p('ww')))),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('should lift only the selected items when the selection starts at a deeper level', () =>
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

    it('should lift the items when the level changes several times inside the selection', () =>
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
            lift,
            doc(
                ul(
                    li(p('aa')),
                    li(p('bb'), ul(li(p('cc')))),
                    li(p('dd'), ul(li(p('ee')), li(p('ss')))),
                    li(p('zz'), ul(li(p('ww')))),
                    li(p('pp')),
                    li(p('hh')),
                ),
            ),
        ));

    it('should lift top-level items out of the list and their nested items to the top level', () =>
        apply(
            doc(ul(li(p('o<a>ne'), ul(li(p('two')))), li(p('thr<b>ee')))),
            lift,
            doc(p('o<a>ne'), ul(li(p('two'))), p('thr<b>ee')),
        ));

    it('should not lift the item that starts at the end of the selection', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('<a>two')), li(p('<b>three')))))),
            lift,
            doc(ul(li(p('one')), li(p('two'), ul(li(p('three')))))),
        ));

    it('should lift the selected items of each list', () =>
        apply(
            doc(
                ul(li(p('one'), ul(li(p('t<a>wo'))))),
                p('text'),
                ul(li(p('three'), ul(li(p('fo<b>ur'))))),
            ),
            lift,
            doc(ul(li(p('one')), li(p('two'))), p('text'), p('three'), ul(li(p('four')))),
        ));

    it('should lift an item of a list inside a block of another item', () =>
        apply(
            doc(ul(li(p('one'), blockquote(ul(li(p('t<a><b>wo'), ul(li(p('three'))))))))),
            lift,
            doc(ul(li(p('one'), blockquote(p('two'), ul(li(p('three'))))))),
        ));

    it('should keep the type of the nested lists of the lifted items', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('t<a>wo'), ol(li(p('th<b>ree')), li(p('four')))))))),
            lift,
            doc(ul(li(p('one')), li(p('two'), ol(li(p('three'), ol(li(p('four')))))))),
        ));

    it('should not lift outside of a list', () =>
        apply(doc(p('o<a>ne'), p('t<b>wo'), ul(li(p('three')))), lift, null));

    it('should lift several groups of items in one transaction', () => {
        const initial = doc(
            ul(li(p('one'), ul(li(p('two')), li(p('th<a>ree')))), li(p('fo<b>ur'))),
        );
        const state = EditorState.create({doc: initial, selection: selFor(initial)});
        let dispatched = 0;
        lift(state, () => dispatched++);
        expect(dispatched).toBe(1);
    });
});

describe('several selected list items', () => {
    function createRandom(seed: number) {
        let state = seed;
        return () => {
            state = (state * 9301 + 49297) % 233280;
            return state / 233280;
        };
    }

    function createList(random: () => number, texts: string[], depth = 1): Node {
        const items: Node[] = [];
        for (let count = 1 + Math.floor(random() * 3); count > 0; count--) {
            const text = `item ${texts.length}`;
            texts.push(text);
            const nested =
                depth < 4 && random() < 0.5 ? [createList(random, texts, depth + 1)] : [];
            items.push(li(p(text), ...nested));
        }
        return ul(...items);
    }

    function findText(node: Node, text: string): number {
        let found = -1;
        node.descendants((child, pos) => {
            if (child.isTextblock && child.textContent === text) found = pos + 1;
            return !child.isTextblock;
        });
        return found;
    }

    function run(state: EditorState, command: Command): EditorState {
        let result = state;
        command(state, (tr) => {
            result = state.apply(tr);
        });
        return result;
    }

    it.each([
        {name: 'sink', command: sink, single: sink, fromTop: true},
        {name: 'lift', command: lift, single: liftListItem(schema.nodes.list_item), fromTop: false},
    ])('should $name them like one by one', ({command, single, fromTop}) => {
        const random = createRandom(1);
        for (let n = 0; n < 500; n++) {
            const texts: string[] = [];
            const initial = doc(createList(random, texts), p('text'), createList(random, texts));
            const first = Math.floor(random() * texts.length);
            const last = first + Math.floor(random() * (texts.length - first));
            const state = EditorState.create({doc: initial, plugins: [mergeListsPlugin()]});

            const all = run(
                state.apply(
                    state.tr.setSelection(
                        TextSelection.create(
                            initial,
                            findText(initial, texts[first]),
                            findText(initial, texts[last]) + 1,
                        ),
                    ),
                ),
                command,
            );

            const selected = texts.slice(first, last + 1);
            let oneByOne = state;
            for (const text of fromTop ? selected : selected.reverse()) {
                const cursor = TextSelection.create(oneByOne.doc, findText(oneByOne.doc, text));
                oneByOne = run(oneByOne.apply(oneByOne.tr.setSelection(cursor)), single);
            }

            ist(all.doc, oneByOne.doc, eq);
        }
    });
});

import type {Node} from 'prosemirror-model';
import {liftListItem, splitListItem, wrapInList} from 'prosemirror-schema-list';
import {
    type Command,
    EditorState,
    NodeSelection,
    Selection,
    TextSelection,
} from 'prosemirror-state';
import {blockquote, doc, eq, li, ol, p, schema, ul} from 'prosemirror-test-builder';

import {sinkOnlySelectedListItem} from 'src/extensions/markdown/Lists/commands';
import ist from 'src/extensions/markdown/Lists/ist';

function selFor(doc: Node) {
    const a = (doc as any).tag.a,
        b = (doc as any).tag.b;
    if (a !== null) {
        const $a = doc.resolve(a);
        if ($a.parent.inlineContent)
            return new TextSelection($a, b != null ? doc.resolve(b) : undefined);
        else return new NodeSelection($a);
    }
    return Selection.atStart(doc);
}

function apply(doc: Node, command: Command, result: Node | null) {
    let state = EditorState.create({doc, selection: selFor(doc)});
    command(state, (tr) => (state = state.apply(tr)));
    ist(state.doc, result || doc, eq);
    if (result && (result as any).tag.a != null) ist(state.selection, selFor(result), eq);
}

describe('wrapInList', () => {
    const wrap = wrapInList(schema.nodes.bullet_list);
    const wrapo = wrapInList(schema.nodes.ordered_list);

    it('can wrap a paragraph', () => apply(doc(p('<a>foo')), wrap, doc(ul(li(p('foo'))))));

    it('can wrap a nested paragraph', () =>
        apply(doc(blockquote(p('<a>foo'))), wrapo, doc(blockquote(ol(li(p('foo')))))));

    it('can wrap multiple paragraphs', () =>
        apply(
            doc(p('foo'), p('ba<a>r'), p('ba<b>z')),
            wrap,
            doc(p('foo'), ul(li(p('bar')), li(p('baz')))),
        ));

    it("doesn't wrap the first paragraph in a list item", () =>
        apply(doc(ul(li(p('<a>foo')))), wrap, null));

    it("doesn't wrap the first para in a different type of list item", () =>
        apply(doc(ol(li(p('<a>foo')))), wrapo, null));

    it('does wrap the second paragraph in a list item', () =>
        apply(doc(ul(li(p('foo'), p('<a>bar')))), wrap, doc(ul(li(p('foo'), ul(li(p('bar'))))))));

    it('joins with the list item above when wrapping its first paragraph', () =>
        apply(
            doc(ul(li(p('foo')), li(p('<a>bar')), li(p('baz')))),
            wrapo,
            doc(ul(li(p('foo'), ol(li(p('bar')))), li(p('baz')))),
        ));

    it('only splits items where valid', () =>
        apply(
            doc(p('<a>one'), ol(li('two')), p('three<b>')),
            wrapo,
            doc(ol(li(p('one'), ol(li('two'))), li(p('three')))),
        ));
});

describe('splitListItem', () => {
    const split = splitListItem(schema.nodes.list_item);

    it('has no effect outside of a list', () => apply(doc(p('foo<a>bar')), split, null));

    it('has no effect on the top level', () => apply(doc('<a>', p('foobar')), split, null));

    it('can split a list item', () =>
        apply(doc(ul(li(p('foo<a>bar')))), split, doc(ul(li(p('foo')), li(p('bar'))))));

    it('can split a list item at the end', () =>
        apply(doc(ul(li(p('foobar<a>')))), split, doc(ul(li(p('foobar')), li(p())))));

    it('deletes selected content', () =>
        apply(doc(ul(li(p('foo<a>ba<b>r')))), split, doc(ul(li(p('foo')), li(p('r'))))));

    it('splits when lifting from a nested list', () =>
        apply(
            doc(ul(li(p('a'), ul(li(p('b')), li(p('<a>'))))), p('x')),
            split,
            doc(ul(li(p('a'), ul(li(p('b')))), li(p('<a>'))), p('x')),
        ));

    it('can lift from a continued nested list item', () =>
        apply(
            doc(ul(li(p('a'), ul(li(p('b')), li(p('ok'), p('<a>'))))), p('x')),
            split,
            doc(ul(li(p('a'), ul(li(p('b')), li(p('ok')))), li(p('<a>'))), p('x')),
        ));

    it('correctly lifts an entirely empty sublist', () =>
        apply(
            doc(ul(li(p('one'), ul(li(p('<a>'))), p('two')))),
            split,
            doc(ul(li(p('one')), li(p('<a>')), li(p('two')))),
        ));
});

describe('liftListItem', () => {
    const lift = liftListItem(schema.nodes.list_item);

    it('can lift from a nested list', () =>
        apply(
            doc(ul(li(p('hello'), ul(li(p('o<a><b>ne')), li(p('two')))))),
            lift,
            doc(ul(li(p('hello')), li(p('one'), ul(li(p('two')))))),
        ));

    it('can lift two items from a nested list', () =>
        apply(
            doc(ul(li(p('hello'), ul(li(p('o<a>ne')), li(p('two<b>')))))),
            lift,
            doc(ul(li(p('hello')), li(p('one')), li(p('two')))),
        ));

    it('can lift two items from a nested three-item list', () =>
        apply(
            doc(ul(li(p('hello'), ul(li(p('o<a>ne')), li(p('two<b>')), li(p('three')))))),
            lift,
            doc(ul(li(p('hello')), li(p('one')), li(p('two'), ul(li(p('three')))))),
        ));

    it('can lift an item out of a list', () =>
        apply(doc(p('a'), ul(li(p('b<a>'))), p('c')), lift, doc(p('a'), p('b'), p('c'))));

    it('can lift two items out of a list', () =>
        apply(
            doc(p('a'), ul(li(p('b<a>')), li(p('c<b>'))), p('d')),
            lift,
            doc(p('a'), p('b'), p('c'), p('d')),
        ));

    it('can lift three items from the middle of a list', () =>
        apply(
            doc(ul(li(p('a')), li(p('b<a>')), li(p('c')), li(p('d<b>')), li(p('e')))),
            lift,
            doc(ul(li(p('a'))), p('b'), p('c'), p('d'), ul(li(p('e')))),
        ));

    it('can lift the first item from a list', () =>
        apply(
            doc(ul(li(p('a<a>')), li(p('b')), li(p('c')))),
            lift,
            doc(p('a'), ul(li(p('b')), li(p('c')))),
        ));

    it('can lift the last item from a list', () =>
        apply(
            doc(ul(li(p('a')), li(p('b')), li(p('c<a>')))),
            lift,
            doc(ul(li(p('a')), li(p('b'))), p('c')),
        ));

    it('joins adjacent lists when lifting an item with subitems', () =>
        apply(
            doc(ol(li(p('a'), ol(li(p('<a>b<b>'), ol(li(p('c')))), li(p('d')))), li(p('e')))),
            lift,
            doc(ol(li(p('a')), li(p('b'), ol(li(p('c')), li(p('d')))), li(p('e')))),
        ));

    it('only joins adjacent lists when lifting if their types match', () =>
        apply(
            doc(ol(li(p('a'), ul(li(p('<a>b<b>'), ol(li(p('c')))), li(p('d')))))),
            lift,
            doc(ol(li(p('a')), li(p('b'), ol(li(p('c'))), ul(li(p('d')))))),
        ));
});

describe('sinkListItem', () => {
    const sink = sinkOnlySelectedListItem(schema.nodes.list_item);

    // it('can wrap a simple item in a list', () =>
    //     apply(
    //         doc(ul(li(p('one')), li(p('t<a><b>wo')), li(p('three')))),
    //         sink,
    //         doc(ul(li(p('one'), ul(li(p('two')))), li(p('three')))),
    //     ));
    //
    // it("won't wrap the first item in a sublist", () =>
    //     apply(doc(ul(li(p('o<a><b>ne')), li(p('two')), li(p('three')))), sink, null));
    //
    // it("will move an item's content into the item above", () =>
    //     apply(
    //         doc(ul(li(p('one')), li(p('...'), ul(li(p('two')))), li(p('t<a><b>hree')))),
    //         sink,
    //         doc(ul(li(p('one')), li(p('...'), ul(li(p('two')), li(p('three')))))),
    //     ));
    //
    // it('sel 1, can wrap a simple item in a list', () =>
    //     apply(
    //         doc(ul(li(p('one')), li(p('t<a>wo')), li(p('th<b>ree')))),
    //         sink,
    //         doc(ul(li(p('one'), ul(li(p('two')), li(p('three')))))),
    //     ));
    //
    // it('move selected', () =>
    //     apply(
    //         doc(ul(li(p('one')), li(p('t<a><b>wo'), ul(li(p('three')))))),
    //         sink,
    //         doc(ul(li(p('one'), ul(li(p('t<a><b>wo'), ul(li(p('three')))))))),
    //     ));

    it('move only selected', () =>
        apply(
            doc(ul(li(p('one')), li(p('t<a><b>wo'), ul(li(p('three')))))),
            sink,
            doc(ul(li(p('one'), ul(li(p('t<a><b>wo')), li(p('three')))))),
        ));
});

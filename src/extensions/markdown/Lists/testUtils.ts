import ist from 'ist';
import type {Node} from 'prosemirror-model';
import {
    type Command,
    EditorState,
    NodeSelection,
    Selection,
    TextSelection,
} from 'prosemirror-state';
import {eq, schema} from 'prosemirror-test-builder';

import {liType} from 'src/extensions';
import {isNotFirstListItemNode} from 'src/extensions/markdown/Lists/commands';

export function selFor(doc: Node) {
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

export function apply(doc: Node, command: Command, result: Node | null) {
    let state = EditorState.create({doc, selection: selFor(doc)});

    // eslint-disable-next-line no-return-assign
    command(state, (tr) => (state = state.apply(tr)));
    ist(state.doc, result || doc, eq);

    if (result && (result as any).tag.a !== null) {
        ist(state.selection, selFor(result), eq);
    }
}

type Tags = {[tag: string]: number};

export function getParams(docNode: Node & {tag: Tags}) {
    const state = EditorState.create({
        doc: docNode,
        selection: TextSelection.create(docNode, docNode.tag.a, docNode.tag.b),
    });
    const {tr, selection} = state;
    const {$from, $to, from, to} = selection;
    const itemType = liType(schema);
    const range = $from.blockRange($to, (node) => isNotFirstListItemNode(node, itemType));

    if (!range) {
        return [tr, schema.nodes.list_item, {start: 0, end: 0, from: 0, to: 0}] as const;
    }

    return [tr, schema.nodes.list_item, {start: range.start, end: range.end, from, to}] as const;
}

export function assertMapEntries(
    resultMap: Map<number, number>,
    expectedEntries: Array<[number, number]>,
) {
    // 1) Check that there are no extra or missing entries.
    console.log('111-3', resultMap.size);
    console.log('111-4', expectedEntries.length);

    console.log('111-5', resultMap.size === expectedEntries.length);

    const x = resultMap.size;
    const y = expectedEntries.length;

    ist(x, y);

    // 2) For each expected [key, value], verify presence and equality.
    for (const [key, value] of expectedEntries) {
        // Ensure the key exists
        console.log('==--==--==-->', resultMap);
        console.log('222-1', key);
        console.log('222-2', resultMap.has(key));
        console.log(
            '222-3',
            resultMap.forEach((key) => console.log(key)),
        );
        ist(resultMap.has(key), true);

        // Ensure the stored value matches
        ist(resultMap.get(key), value);
        console.log('333-1', ist(resultMap.get(key), value));
    }
}

import type {Node} from 'prosemirror-model';
import type {Transaction} from 'prosemirror-state';

export function applyTableChanges(tr: Transaction, tablePos: number, table: Node): boolean {
    const before = tr.doc.nodeAt(tablePos);
    if (!before || before.type !== table.type || before.childCount !== table.childCount)
        return false;
    const sections: {before: Node; after: Node; pos: number}[] = [];
    before.forEach((section, offset, index) => {
        sections.push({before: section, after: table.child(index), pos: tablePos + offset + 1});
    });
    if (sections.some((section) => section.before.type !== section.after.type)) return false;
    for (const section of sections.reverse()) {
        if (section.before.childCount !== section.after.childCount) {
            replaceChildren(tr, section.pos, section.before, section.after);
            continue;
        }
        const rows: {before: Node; after: Node; pos: number}[] = [];
        section.before.forEach((row, offset, index) => {
            rows.push({
                before: row,
                after: section.after.child(index),
                pos: section.pos + offset + 1,
            });
        });
        for (const row of rows.reverse()) replaceChildren(tr, row.pos, row.before, row.after);
    }
    if (!before.sameMarkup(table)) tr.setNodeMarkup(tablePos, undefined, table.attrs, table.marks);
    return true;
}

function replaceChildren(tr: Transaction, pos: number, before: Node, after: Node) {
    let first = 0;
    let start = 0;
    while (
        first < before.childCount &&
        first < after.childCount &&
        before.child(first).eq(after.child(first))
    ) {
        start += before.child(first++).nodeSize;
    }
    let oldEnd = before.childCount;
    let newEnd = after.childCount;
    let oldSize = before.content.size;
    let newSize = after.content.size;
    while (
        oldEnd > first &&
        newEnd > first &&
        before.child(oldEnd - 1).eq(after.child(newEnd - 1))
    ) {
        oldSize -= before.child(--oldEnd).nodeSize;
        newSize -= after.child(--newEnd).nodeSize;
    }
    if (first !== oldEnd || first !== newEnd) {
        tr.replaceWith(pos + 1 + start, pos + 1 + oldSize, after.content.cut(start, newSize));
    }
}

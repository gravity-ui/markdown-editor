import {Mark, type Node, type NodeType} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, type Transaction} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from '../../../Header/HeaderSpecs/const';
import {changedRange} from '../../../changedRange';
import {joinTextLines} from '../../../joinTextLines';
import {plainTextInput} from '../../../plainTextInput';
import {headerTitleNodeType} from '../../HeaderTitleSpecs';

function keepsTitle(tr: Transaction, title: Node, pos: number) {
    const start = tr.mapping.mapResult(pos + 1, 1);
    if (start.deletedAcross) return true;
    const $start = tr.doc.resolve(start.pos);
    const $end = tr.doc.resolve(tr.mapping.map(pos + title.nodeSize - 1, -1));
    return (
        $start.parent.type === title.type &&
        $end.start() === $start.start() &&
        $start.node(-1).type === tr.before.resolve(pos).parent.type
    );
}

function keepsTitles(tr: Transaction) {
    if (!tr.docChanged || tr.getMeta('history$')) return true;
    const range = changedRange(tr, 'before');
    if (!range) return true;
    const type = headerTitleNodeType(tr.doc.type.schema);
    let kept = true;
    tr.before.nodesBetween(range.from, range.to, (node, pos) => {
        if (node.type === type) kept &&= keepsTitle(tr, node, pos);
        return kept && !node.isTextblock;
    });
    return kept;
}

function titlesOf(node: Node | null | undefined, type: NodeType) {
    let titles = 0;
    node?.forEach((child) => {
        if (child.type === type) titles++;
    });
    return titles;
}

/** A header keeps one title. A header that already has several, as loaded, stays editable. */
function oneTitlePerHeader(tr: Transaction) {
    const range = tr.docChanged && changedRange(tr, 'after');
    if (!range) return true;
    const {schema} = tr.doc.type;
    const header = headerNodeType(schema);
    const title = headerTitleNodeType(schema);
    const back = tr.mapping.invert();
    let single = true;
    tr.doc.nodesBetween(range.from, range.to, (node, pos) => {
        if (node.type !== header) return !node.isTextblock;
        const titles = titlesOf(node, title);
        if (titles > 1) {
            const before = tr.before.nodeAt(back.map(pos, 1));
            single &&= before?.type === header && titlesOf(before, title) >= titles;
        }
        return single;
    });
    return single;
}

export const headerTitleGuardPlugin = () =>
    new Plugin({
        filterTransaction: (tr) => keepsTitles(tr) && oneTitlePerHeader(tr),
        appendTransaction: (trs, _oldState, state) =>
            joinTextLines(
                trs,
                state,
                (_text, parent) => parent.type === headerTitleNodeType(state.schema),
            ),
        props: {
            handleTextInput: plainTextInput((state, from) =>
                state.doc.resolve(from).parent.type === headerTitleNodeType(state.schema)
                    ? Mark.none
                    : null,
            ),
        },
    });

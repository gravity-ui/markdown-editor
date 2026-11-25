import {Mark, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, type Transaction} from '@gravity-ui/markdown-editor/pm/state';

import {changedRange} from '../../../../utils/changedRange';
import {joinTextLines} from '../../../../utils/joinTextLines';
import {plainTextInput} from '../../../../utils/plainTextInput';
import {bannerTitleNodeType} from '../../BannerTitleSpecs';

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
    const type = bannerTitleNodeType(tr.doc.type.schema);
    let kept = true;
    tr.before.nodesBetween(range.from, range.to, (node, pos) => {
        if (node.type === type) kept &&= keepsTitle(tr, node, pos);
        return kept && !node.isTextblock;
    });
    return kept;
}

export const bannerTitleGuardPlugin = () =>
    new Plugin({
        filterTransaction: keepsTitles,
        appendTransaction: (trs, _oldState, state) =>
            joinTextLines(
                trs,
                state,
                (_text, parent) => parent.type === bannerTitleNodeType(state.schema),
            ),
        props: {
            handleTextInput: plainTextInput((state, from) =>
                state.doc.resolve(from).parent.type === bannerTitleNodeType(state.schema)
                    ? Mark.none
                    : null,
            ),
        },
    });

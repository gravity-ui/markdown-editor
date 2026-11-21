import type {Mark, Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, TextSelection, type Transaction} from '@gravity-ui/markdown-editor/pm/state';
import {Mapping} from '@gravity-ui/markdown-editor/pm/transform';
import {
    LinkAttr,
    codeMarkName,
    linkMarkName,
    subscriptMarkName,
    superscriptMarkName,
} from '@gravity-ui/markdown-editor/specs';

import {type Range, changedRange} from '../../../changedRange';
import {isButton} from '../../ButtonSpecs/utils';

const excludedMarks = [linkMarkName, codeMarkName, subscriptMarkName, superscriptMarkName];

const allowed = (mark: Mark) => !excludedMarks.includes(mark.type.name);

const isPlaceholder = (mark: Mark) =>
    mark.type.name === linkMarkName && Boolean(mark.attrs[LinkAttr.IsPlaceholder]);

function changedRangeOf(transactions: readonly Transaction[]) {
    let from = -1;
    let to = -1;
    for (const tr of transactions) {
        if (from >= 0) {
            from = tr.mapping.map(from, -1);
            to = tr.mapping.map(to, 1);
        }
        const range = tr.docChanged ? changedRange(tr, 'after') : null;
        if (range) {
            from = from < 0 ? range.from : Math.min(from, range.from);
            to = Math.max(to, range.to);
        }
    }
    return from < 0 ? null : {from, to};
}

export const buttonMarksPlugin = () =>
    new Plugin({
        appendTransaction(transactions, oldState, state) {
            const range = changedRangeOf(transactions);
            if (!range) return null;
            const placeholderRuns: Range[] = [];
            const buttons: {node: Node; pos: number}[] = [];
            state.doc.nodesBetween(range.from, range.to, (node, pos) => {
                if (node.isText) {
                    const last = placeholderRuns.at(-1);
                    if (!node.marks.some(isPlaceholder)) return false;
                    if (last?.to === pos) last.to = pos + node.nodeSize;
                    else placeholderRuns.push({from: pos, to: pos + node.nodeSize});
                    return false;
                }
                if (!isButton(node)) return true;
                if (!node.marks.every(allowed)) buttons.push({node, pos});
                return false;
            });
            if (!buttons.length) return null;
            const back = new Mapping(transactions.flatMap((tr) => tr.mapping.maps)).invert();
            const tr = state.tr;
            for (const {node, pos} of buttons) {
                const before = back.mapResult(pos, 1);
                const old = before.deleted ? null : oldState.doc.nodeAt(before.pos);
                const marks = old?.attrs === node.attrs ? old.marks : node.marks;
                tr.setNodeMarkup(pos, null, node.attrs, marks.filter(allowed));
            }
            const placeholder = buttons
                .map(({node}) => node.marks.find(isPlaceholder))
                .find(Boolean);
            const kept = placeholderRuns.pop();
            if (placeholder && kept) {
                for (const run of placeholderRuns) tr.removeMark(run.from, run.to, placeholder);
                tr.setSelection(TextSelection.create(tr.doc, kept.to - 1));
            }
            return tr;
        },
    });

import type {Mark, Node} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {Mapping} from '@gravity-ui/markdown-editor/pm/transform';
import {
    LinkAttr,
    codeMarkName,
    linkMarkName,
    subscriptMarkName,
    superscriptMarkName,
} from '@gravity-ui/markdown-editor/specs';

import {type Range, coveringRanges} from '../../../changedRange';
import {isButton} from '../../ButtonSpecs/utils';

const excludedMarks = [linkMarkName, codeMarkName, subscriptMarkName, superscriptMarkName];

const allowed = (mark: Mark) => !excludedMarks.includes(mark.type.name);

const isPlaceholder = (mark: Mark) =>
    mark.type.name === linkMarkName && Boolean(mark.attrs[LinkAttr.IsPlaceholder]);

export const buttonMarksPlugin = () =>
    new Plugin({
        appendTransaction(transactions, oldState, state) {
            const ranges = coveringRanges(transactions, (tr) => tr.docChanged);
            if (!ranges.length) return null;
            const from = Math.min(...ranges.map((range) => range.from));
            const to = Math.max(...ranges.map((range) => range.to));
            const placeholderRuns: Range[] = [];
            const buttons: {node: Node; pos: number}[] = [];
            state.doc.nodesBetween(from, to, (node, pos) => {
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

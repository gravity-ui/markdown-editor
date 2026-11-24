import type {Transaction} from '@gravity-ui/markdown-editor/pm/state';
import {AddMarkStep, RemoveMarkStep, type Step} from '@gravity-ui/markdown-editor/pm/transform';

export type Range = {from: number; to: number};

function stepRanges(step: Step, add: (from: number, to: number) => void) {
    if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
        add(step.from, step.to);
    } else {
        step.getMap().forEach((_oldStart, _oldEnd, start, end) => add(start, end));
    }
}

export function changedRange(tr: Transaction, doc: 'before' | 'after') {
    let from = -1;
    let to = -1;
    tr.steps.forEach((step, index) => {
        if (from >= 0) {
            const map = tr.mapping.maps[index];
            from = map.map(from, -1);
            to = map.map(to, 1);
        }
        stepRanges(step, (start, end) => {
            from = from < 0 ? start : Math.min(from, start);
            to = Math.max(to, end);
        });
    });
    if (from < 0) return null;
    return doc === 'after' ? {from, to} : rangeBefore(tr, {from, to});
}

function rangeBefore(tr: Transaction, {from, to}: Range): Range {
    const back = tr.mapping.invert();
    return {from: back.map(from, -1), to: back.map(to, 1)};
}

function mapThroughLater(
    trs: readonly Transaction[],
    index: number,
    from: number,
    to: number,
    assoc: 1 | -1 = -1,
) {
    let start = from;
    let end = to;
    for (const later of trs.slice(index + 1)) {
        start = later.mapping.map(start, assoc);
        end = later.mapping.map(end, -assoc);
    }
    return start < end ? {from: start, to: end} : null;
}

export function coveringRanges(trs: readonly Transaction[], pick: (tr: Transaction) => boolean) {
    const ranges: Range[] = [];
    trs.forEach((tr, index) => {
        const changed = pick(tr) ? changedRange(tr, 'after') : null;
        const range = changed && mapThroughLater(trs, index, changed.from, changed.to);
        if (range) ranges.push(range);
    });
    return ranges;
}

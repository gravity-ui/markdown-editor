import type {Node} from '#pm/model';
import type {Transaction} from '#pm/state';
import {
    AddMarkStep,
    AddNodeMarkStep,
    AttrStep,
    DocAttrStep,
    RemoveMarkStep,
    RemoveNodeMarkStep,
    ReplaceStep,
} from '#pm/transform';

/**
 * Returns true if the transaction is a single text-insertion step
 * (e.g. typing one character).
 */
export function isTextInsertTr(tr: Transaction): boolean {
    if (tr.steps.length !== 1) return false;
    const [step] = tr.steps;
    return (
        step instanceof ReplaceStep &&
        step.from === step.to &&
        step.slice.content.childCount === 1 &&
        step.slice.content.child(0).type.name === 'text'
    );
}

/**
 * Returns true if the transaction is a single-character deletion
 * (deletion of exactly one position, no replacement content).
 */
export function isSingleCharDeleteTr(tr: Transaction): boolean {
    if (tr.steps.length !== 1) return false;
    const [step] = tr.steps;
    return step instanceof ReplaceStep && step.to - step.from === 1 && step.slice.size === 0;
}

const safeSteps = [AddMarkStep, AddNodeMarkStep, DocAttrStep, RemoveMarkStep, RemoveNodeMarkStep];

/**
 * Returns true if the transaction does not change the structural shape
 * of the document — i.e. the relative order/nesting of blocks and node
 * attrs (outside of marks/doc-attrs) stay the same. Absolute positions
 * may still shift due to text being inserted or removed within textblocks.
 * Such transactions only insert/delete text within a textblock or toggle
 * marks/doc-attrs.
 */
export function isNonStructuralTr(tr: Transaction): boolean {
    if (isTextInsertTr(tr) || isSingleCharDeleteTr(tr)) return true;
    if (tr.steps.every((step) => safeSteps.some((SafeStep) => step instanceof SafeStep)))
        return true;
    return false;
}

/** @internal */
export function getChangedRanges(tr: Transaction): {from: number; to: number}[] {
    const ranges: {from: number; to: number}[] = [];
    const {maps} = tr.mapping;

    tr.steps.forEach((step, i) => {
        if (step instanceof AttrStep) {
            let pos = step.pos;
            for (let j = i + 1; j < maps.length; j++) {
                pos = maps[j].map(pos);
            }
            const node = tr.doc.nodeAt(pos);
            if (node) {
                ranges.push({from: pos, to: pos + node.nodeSize});
            }
            return;
        }

        step.getMap().forEach((_oldStart, _oldEnd, newStart, newEnd) => {
            let from = newStart;
            let to = newEnd;
            for (let j = i + 1; j < maps.length; j++) {
                from = maps[j].map(from, -1);
                to = maps[j].map(to, 1);
            }
            ranges.push({from, to});
        });
    });

    return ranges;
}

/** @internal */
export function forEachChangedNode(
    tr: Transaction,
    callback: (node: Node, pos: number, parent: Node | null, index: number) => boolean | void,
): void {
    for (const {from, to} of getChangedRanges(tr)) {
        tr.doc.nodesBetween(from, to, callback);
    }
}

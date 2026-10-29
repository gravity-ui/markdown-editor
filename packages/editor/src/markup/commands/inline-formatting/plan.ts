import {isolateHistory} from '@codemirror/commands';
import {
    type ChangeSpec,
    EditorSelection,
    type EditorState,
    type SelectionRange,
    type TransactionSpec,
} from '@codemirror/state';

import {chooseMarkers} from './markers';
import type {
    FormattingPart,
    FormattingPlan,
    InlineCommandSpec,
    SourceEdit,
    SyntaxTree,
    TextRange,
} from './types';
import {planUrlNormalization} from './urls';

type MarkerEdit = {from: number; insert: string; side: 'open' | 'close' | 'cursor'};
type EdgeMarkers = Map<number, {open: number; close: number}>;

/**
 * Plans marker and URL edits for all selections, using old document positions.
 * Pass collected parts here, then build one transaction from the returned plan.
 */
export function planFormatting(
    state: EditorState,
    partsBySelection: FormattingPart[][],
    spec: InlineCommandSpec,
    tree: SyntaxTree | null,
): FormattingPlan | undefined {
    const parts = partsBySelection.flat();
    if (!parts.length) return undefined;

    // Mixed selections keep their existing wrappers and add only the missing ones.
    const remove = spec.kind !== 'wrap' && parts.every((part) => part.wrapper);
    const urls = remove ? [] : planUrlNormalization(state, tree, parts, spec);
    const markers = remove
        ? []
        : mergeAdjacentParts(parts).flatMap((part) => wrapPart(state, part, spec, urls));
    const edits: ChangeSpec[] = remove ? removeWrappers(parts) : [...markers, ...urls];
    const edges = collectEdgeMarkers(markers);
    if (!edits.length) return undefined;

    const selections = state.selection.ranges.map((range, index) =>
        planSelection(state, range, partsBySelection[index], spec, urls, remove, edges),
    );
    return {edits, selections};
}

/**
 * Maps selections through the planned edits and creates one isolated undo step.
 * Pass the result to state.update() after planFormatting().
 */
export function createFormattingTransaction(
    state: EditorState,
    plan: FormattingPlan,
): TransactionSpec {
    const changes = state.changes(plan.edits);
    const ranges = plan.selections.map(
        ({range, bounds, cursorOffset, openingLength, closingLength}) => {
            if (range.empty) {
                // Map before the insertion, then place the cursor after the opening marker.
                const pos = changes.mapPos(range.head, -1) + cursorOffset;
                return EditorSelection.range(
                    pos,
                    pos,
                    range.goalColumn,
                    range.bidiLevel ?? undefined,
                );
            }
            // At a shared boundary, include only this range's opening or closing markers.
            const from = changes.mapPos(bounds.from, 1) - openingLength;
            const to = changes.mapPos(bounds.to, -1) + closingLength;
            const backward = range.anchor > range.head;
            return EditorSelection.range(
                backward ? to : from,
                backward ? from : to,
                range.goalColumn,
                range.bidiLevel ?? undefined,
            );
        },
    );
    return {
        changes,
        selection: EditorSelection.create(ranges, state.selection.mainIndex),
        annotations: isolateHistory.of('full'),
        userEvent: 'input.format',
        scrollIntoView: true,
    };
}

/**
 * Deletes each selected wrapper once, leaving its content and nested layers intact.
 * Used when every formatting part already has the requested wrapper.
 */
function removeWrappers(parts: FormattingPart[]): ChangeSpec[] {
    const edits: ChangeSpec[] = [];
    const removed = new Set<string>();
    for (const {wrapper} of parts) {
        if (!wrapper) continue;
        const {open, close} = wrapper;
        const key = `${open.from}:${open.to}:${close.from}:${close.to}`;
        // Touching selections can refer to the same wrapper.
        if (removed.has(key)) continue;
        edits.push({...open, insert: ''}, {...close, insert: ''});
        removed.add(key);
    }
    return edits;
}

/**
 * Adds missing markers around one part, or completes its unpaired marker.
 * Used in add mode; already wrapped parts produce no marker edits.
 */
function wrapPart(
    state: EditorState,
    part: FormattingPart,
    spec: InlineCommandSpec,
    urls: SourceEdit[],
): MarkerEdit[] {
    if (part.wrapper) return [];
    const {before, after} = chooseMarkers(state, part, spec, urls);
    if (part.from === part.to) return [{from: part.from, insert: before + after, side: 'cursor'}];

    const markerPosition = part.existingMarker === 'open' ? part.from : part.to - spec.after.length;
    const markerIsInUrl = urls.some(
        (url) => url.from <= markerPosition && url.to >= markerPosition + spec.before.length,
    );
    // A URL replacement keeps this character inside the link; it cannot close the style.
    const existingMarker = markerIsInUrl ? undefined : part.existingMarker;
    const edits: MarkerEdit[] = [];
    if (existingMarker !== 'open') edits.push({from: part.from, insert: before, side: 'open'});
    if (existingMarker !== 'close') edits.push({from: part.to, insert: after, side: 'close'});
    return edits;
}

/** Counts actual edge insertions after joining parts. Used to map selection bounds. */
function collectEdgeMarkers(edits: MarkerEdit[]): EdgeMarkers {
    const edges: EdgeMarkers = new Map();
    for (const {from, insert, side} of edits) {
        // A cursor pair must stay outside the next non-empty selection.
        if (side === 'cursor') continue;
        let lengths = edges.get(from);
        if (!lengths) {
            lengths = {open: 0, close: 0};
            edges.set(from, lengths);
        }
        lengths[side] += insert.length;
    }
    return edges;
}

/**
 * Joins touching plain parts so one wrapper can cover them.
 * Used before adding markers; wrappers, cursors, and marker repairs stay separate.
 */
function mergeAdjacentParts(parts: FormattingPart[]): FormattingPart[] {
    const merged: FormattingPart[] = [];
    let pending: FormattingPart | undefined;
    for (const part of parts) {
        if (part.wrapper || part.existingMarker || part.from === part.to) {
            merged.push(part);
            pending = undefined;
        } else if (pending && pending.to === part.from && pending.literal === part.literal) {
            pending.to = part.to;
        } else {
            pending = {...part};
            merged.push(pending);
        }
    }
    return merged;
}

/**
 * Plans old selection bounds and the cursor offset inside new markers.
 * Used for each original selection before applying any document edits.
 */
function planSelection(
    state: EditorState,
    range: SelectionRange,
    parts: FormattingPart[],
    spec: InlineCommandSpec,
    urls: SourceEdit[],
    remove: boolean,
    edges: EdgeMarkers,
): FormattingPlan['selections'][number] {
    let bounds = {from: range.from, to: range.to};
    let cursorOffset = 0;
    if (!remove) {
        for (const part of parts) {
            if (part.wrapper || part.existingMarker) {
                bounds = includePart(state, range, bounds, part);
            } else if (part.from === part.to) {
                cursorOffset = chooseMarkers(state, part, spec, urls).before.length;
            }
        }
    }
    return {
        range,
        bounds,
        cursorOffset,
        openingLength: edges.get(bounds.from)?.open ?? 0,
        closingLength: edges.get(bounds.to)?.close ?? 0,
    };
}

/**
 * Includes existing markers in the selection without reaching another selection.
 * Used in add mode for complete wrappers and repaired marker pairs.
 */
function includePart(
    state: EditorState,
    range: SelectionRange,
    bounds: TextRange,
    part: FormattingPart,
): TextRange {
    const from = part.wrapper?.open.from ?? part.from;
    const to = part.wrapper?.close.to ?? part.to;
    const overlapsOtherSelection = state.selection.ranges.some(
        (other) => other !== range && other.from <= to && other.to >= from,
    );
    // Expanding across another selection would merge independent selection ranges.
    if (overlapsOtherSelection) return bounds;
    return {from: Math.min(bounds.from, from), to: Math.max(bounds.to, to)};
}

import type {EditorState, SelectionRange} from '@codemirror/state';

import {excludeDirectiveLines} from './directives';
import {collectLiteralParts, findLiteralContext} from './literal';
import {isEscaped, markerPairs, repairMarkers, targetNode} from './markers';
import {
    NodeName,
    codeBodyRange,
    collectBlockMarkers,
    containsNode,
    excludeBlockMarkers,
    intersectRanges,
    isAtomicNode,
    isBareUrl,
    isCodeBlock,
    isCursorBlocked,
    isStyleNode,
    isTextBlock,
    linkLabelRange,
    nodesInRange,
    readWrapper,
    trimWhitespace,
} from './syntax';
import type {
    FormattingPart,
    InlineCommandSpec,
    MarkupWrapper,
    SyntaxNode,
    SyntaxTree,
    TextRange,
} from './types';

type NodeParts = FormattingPart[] | 'include';
type NodeChildren = WeakMap<SyntaxNode, SyntaxNode[]>;

/**
 * Collects editable parts and existing wrappers for every selection.
 * Use with a complete syntax tree before planning marker edits.
 */
export function collectFormattingParts(
    state: EditorState,
    tree: SyntaxTree,
    spec: InlineCommandSpec,
): FormattingPart[][] {
    return state.selection.ranges.map((range) => collectParts(state, tree, range, spec));
}

/**
 * Chooses cursor, literal, or structural handling for one selection.
 * Used by collectFormattingParts() to keep block syntax outside editable ranges.
 */
function collectParts(
    state: EditorState,
    tree: SyntaxTree,
    range: SelectionRange,
    spec: InlineCommandSpec,
): FormattingPart[] {
    if (range.empty) return collectCursor(state, tree, range, spec);
    const coverage = adjacentCoverage(state, range);
    const context = findLiteralContext(state, tree, range, spec);
    if (context) return collectLiteralParts(state, range, coverage, context, spec);
    const parts: FormattingPart[] = [];
    const children: NodeChildren = new WeakMap();
    const multiline = state.doc.lineAt(range.from).number !== state.doc.lineAt(range.to).number;
    // Stop at text blocks so a wrapper cannot cross headings, list items, or table cells.
    const visit = (node: SyntaxNode) => {
        if (node.to <= range.from || node.from >= range.to) return;
        if (isCodeBlock(node)) {
            const body = codeBodyRange(state, node);
            // Local edits inside code are literal; selections crossing code skip it.
            if (range.from >= body.from && range.to <= body.to) {
                parts.push(...collectLiteralParts(state, range, coverage, body, spec, node));
            }
            return;
        }
        if (node.name === NodeName.HTMLBlock || node.name === NodeName.LinkReference) return;
        if (isTextBlock(node)) {
            const selected = {
                from: Math.max(range.from, node.from),
                to: Math.min(range.to, node.to),
            };
            const ranges = multiline ? excludeDirectiveLines(state, node, selected) : [selected];
            const markers = collectBlockMarkers(node, selected);
            for (const source of ranges) {
                const bounds = trimBlock(state, node, source, markers);
                if (bounds.from >= bounds.to) continue;
                // Excluded lines must not count toward a whole-wrapper toggle.
                const safeCoverage =
                    source.from === selected.from && source.to === selected.to
                        ? coverage
                        : intersectRanges(coverage, source);
                const inline = collectInline(state, node, bounds, safeCoverage, spec, children);
                parts.push(...inline.map((part) => repairMarkers(state, part, bounds, spec, node)));
            }
            return;
        }
        for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
    };
    visit(tree.topNode);
    return parts;
}

/**
 * Joins plain text and whole safe nodes, splitting around protected or styled nodes.
 * Used within one text block or the selected content of an inline node.
 */
function collectInline(
    state: EditorState,
    parent: SyntaxNode,
    bounds: TextRange,
    coverage: TextRange,
    spec: InlineCommandSpec,
    children: NodeChildren,
): FormattingPart[] {
    const parts: FormattingPart[] = [];
    let pending: TextRange | undefined;
    let pos = bounds.from;
    for (const child of childrenInRange(parent, bounds, children)) {
        append(pos, child.from);
        pos = child.to;
        const nested = collectNodeParts(state, child, bounds, coverage, spec, children);
        if (nested === 'include') {
            append(child.from, child.to);
        } else {
            // End the plain part before a node with its own wrapper or protection rules.
            flush();
            parts.push(...nested);
        }
    }
    append(pos, bounds.to);
    flush();
    return parts;

    /** Adds selected text to the pending plain part during inline traversal. */
    function append(start: number, end: number) {
        const from = Math.max(bounds.from, start);
        const to = Math.min(bounds.to, end);
        if (from >= to) return;
        if (pending && pending.to === from) pending.to = to;
        else {
            flush();
            pending = {from, to};
        }
    }

    /** Emits the pending part without edge whitespace before crossing a node boundary. */
    function flush() {
        if (!pending) return;
        const part = trimWhitespace(state, pending);
        if (part.from < part.to) parts.push(part);
        pending = undefined;
    }
}

/**
 * Decides whether an inline node can be included, split, or skipped.
 * Used during inline traversal; "include" joins the node to nearby plain text.
 */
function collectNodeParts(
    state: EditorState,
    node: SyntaxNode,
    bounds: TextRange,
    coverage: TextRange,
    spec: InlineCommandSpec,
    children: NodeChildren,
): NodeParts {
    const full = bounds.from <= node.from && bounds.to >= node.to;
    if (node.name === NodeName.InlineCode || isStyleNode(node))
        return collectStyledParts(state, node, bounds, coverage, spec, children);
    if (node.name === NodeName.Link) {
        if (full) return 'include';
        const selectedLabel = intersectRanges(bounds, linkLabelRange(state, node));
        return selectedLabel.from < selectedLabel.to
            ? collectInline(state, node, selectedLabel, coverage, spec, children)
            : [];
    }
    if (isAtomicNode(node)) return full ? 'include' : [];
    if (node.name === NodeName.HTMLTag) return [];
    if (isBareUrl(node)) return full ? 'include' : [];
    return 'include';
}

/**
 * Finds a selected target wrapper or collects editable content inside another style.
 * Used for style and code nodes; partial selections do not remove an outer layer.
 */
function collectStyledParts(
    state: EditorState,
    node: SyntaxNode,
    bounds: TextRange,
    coverage: TextRange,
    spec: InlineCommandSpec,
    children: NodeChildren,
): NodeParts {
    const full = bounds.from <= node.from && bounds.to >= node.to;
    const wrapper = readWrapper(state, node);
    if (!wrapper) return [];
    const content = {from: wrapper.open.to, to: wrapper.close.from};
    const target = targetNode(spec);
    // Use the actual pair, not an inherited style; removal affects only this layer.
    if (node.name === target && coverage.from <= content.from && coverage.to >= content.to) {
        return [{...intersectRanges(bounds, content), wrapper}];
    }
    if (node.name === NodeName.InlineCode) return full ? 'include' : [];
    // Descend when a nested target style may already cover part of the selection.
    if (full && !containsNode(node, target)) return 'include';
    const selectedContent = intersectRanges(bounds, content);
    return selectedContent.from < selectedContent.to
        ? collectInline(state, node, selectedContent, coverage, spec, children)
        : [];
}

/**
 * Finds an empty pair to remove, or a safe position for a new pair.
 * Used for empty selections, including cursors inside literal contexts.
 */
function collectCursor(
    state: EditorState,
    tree: SyntaxTree,
    range: SelectionRange,
    spec: InlineCommandSpec,
): FormattingPart[] {
    const pos = range.head;
    const wrapper = emptyWrapper(state, tree, pos, spec);
    if (wrapper) return [{from: pos, to: pos, wrapper}];
    if (findLiteralContext(state, tree, range, spec)) return [{from: pos, to: pos, literal: true}];
    let node: SyntaxNode | null = tree.resolve(pos, 1);
    while (node) {
        if (isCodeBlock(node)) {
            const body = codeBodyRange(state, node);
            return pos >= body.from && pos <= body.to ? [{from: pos, to: pos, literal: true}] : [];
        }
        if (isCursorBlocked(state, node, pos)) return [];
        node = node.parent;
    }
    return [{from: pos, to: pos}];
}

/**
 * Reads an unescaped marker pair around the cursor without cutting a parsed marker.
 * Used by toggles to undo an empty pair that the syntax tree may not recognize.
 */
function emptyWrapper(
    state: EditorState,
    tree: SyntaxTree,
    pos: number,
    spec: InlineCommandSpec,
): MarkupWrapper | undefined {
    if (spec.kind === 'wrap') return undefined;
    const parent = tree.resolve(pos, 1).parent;
    if (
        parent &&
        (isStyleNode(parent) ||
            parent.name === NodeName.InlineCode ||
            (parent.name === NodeName.FencedCode && parent.to > state.doc.lineAt(parent.from).to))
    ) {
        // Matching text inside one parsed delimiter is not an empty wrapper.
        for (const marker of [parent.firstChild, parent.lastChild]) {
            if (marker && marker.from < pos && marker.to > pos) return undefined;
        }
    }
    for (const {before, after} of markerPairs(spec)) {
        if (
            pos < before.length ||
            state.sliceDoc(pos - before.length, pos) !== before ||
            state.sliceDoc(pos, pos + after.length) !== after ||
            isEscaped(state, pos - before.length)
        )
            continue;
        return {
            open: {from: pos - before.length, to: pos},
            close: {from: pos, to: pos + after.length},
        };
    }
    return undefined;
}

/**
 * Combines touching non-empty selections into bounds used for wrapper detection.
 * Each selection still keeps its own parts and direction in the final transaction.
 */
function adjacentCoverage(state: EditorState, range: SelectionRange): TextRange {
    const ranges = state.selection.ranges;
    const index = ranges.indexOf(range);
    let from = range.from;
    let to = range.to;
    for (let i = index - 1; i >= 0 && !ranges[i].empty && ranges[i].to === from; i--)
        from = ranges[i].from;
    for (let i = index + 1; i < ranges.length && !ranges[i].empty && ranges[i].from === to; i++)
        to = ranges[i].to;
    return {from, to};
}

/**
 * Removes edge block prefixes and whitespace from selected block bounds.
 * Used before collecting the block's inline content.
 */
function trimBlock(
    state: EditorState,
    node: SyntaxNode,
    bounds: TextRange,
    markers: SyntaxNode[],
): TextRange {
    return trimWhitespace(state, excludeBlockMarkers(state, node, bounds, markers));
}

/** Cache each parent's children once and read only those inside the current source range. */
function childrenInRange(parent: SyntaxNode, bounds: TextRange, cache: NodeChildren): SyntaxNode[] {
    let children = cache.get(parent);
    if (!children) {
        children = [];
        for (let child = parent.firstChild; child; child = child.nextSibling) children.push(child);
        cache.set(parent, children);
    }
    return nodesInRange(children, bounds);
}

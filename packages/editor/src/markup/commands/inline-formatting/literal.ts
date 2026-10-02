import {EditorSelection, type EditorState, type SelectionRange} from '@codemirror/state';

import {getInlineRanges} from '../inline-ranges';

import {isEscaped, readLiteralMarkers} from './markers';
import {NodeName, excludeBlockMarkers, intersectRanges, isBareUrl} from './syntax';
import type {FormattingPart, InlineCommandSpec, SyntaxNode, SyntaxTree, TextRange} from './types';

/**
 * Reads one selected word and its optional style markers without a syntax tree.
 * Used first for style toggles; returns undefined when structural checks are needed.
 */
export function collectSimpleWord(
    state: EditorState,
    spec: InlineCommandSpec,
): FormattingPart[][] | undefined {
    if (spec.kind !== 'style' || state.selection.ranges.length !== 1) return undefined;
    const range = state.selection.main;
    if (range.empty) return undefined;
    const part = readLiteralMarkers(state, range, spec);
    if (!/^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u.test(state.sliceDoc(part.from, part.to)))
        return undefined;
    const bounds = part.wrapper ? {from: part.wrapper.open.from, to: part.wrapper.close.to} : part;
    if (isEscaped(state, bounds.from)) return undefined;
    // Longer marker runs need the tree; this shortcut removes only one plain pair.
    if (part.wrapper) {
        const before = state.sliceDoc(part.wrapper.open.from, part.wrapper.open.to);
        const after = state.sliceDoc(part.wrapper.close.from, part.wrapper.close.to);
        if (
            state.sliceDoc(Math.max(0, bounds.from - 1), bounds.from) === before[0] ||
            state.sliceDoc(bounds.to, bounds.to + 1) === after[after.length - 1]
        )
            return undefined;
    } else if (
        /[*_~+#=]$/.test(state.sliceDoc(Math.max(0, range.from - 1), range.from)) ||
        /^[*_~+#=]/.test(state.sliceDoc(range.to, range.to + 1))
    ) {
        return undefined;
    }
    return [[part]];
}

/**
 * Splits a selection inside code or a field at blank lines and reads literal markers.
 * Used only when the whole selection stays inside the supplied context.
 */
export function collectLiteralParts(
    state: EditorState,
    range: SelectionRange,
    coverage: TextRange,
    context: TextRange,
    spec: InlineCommandSpec,
    codeNode?: SyntaxNode,
): FormattingPart[] {
    const normalize = (bounds: TextRange) =>
        codeNode ? excludeBlockMarkers(state, codeNode, bounds) : bounds;
    const joined =
        coverage.from >= context.from && coverage.to <= context.to
            ? getInlineRanges(state.doc, EditorSelection.range(coverage.from, coverage.to)).map(
                  normalize,
              )
            : [];
    return getInlineRanges(state.doc, range)
        .map((raw) => {
            const bounds = normalize(raw);
            const combined = joined.find(
                (part) => part.from <= bounds.from && part.to >= bounds.to,
            );
            // Touching selections may share one pair; detect it across their full coverage.
            if (combined) {
                const part = literalPart(state, combined, context, spec);
                if (part.wrapper)
                    return {...intersectRanges(bounds, part), wrapper: part.wrapper, literal: true};
            }
            return literalPart(state, bounds, context, spec);
        })
        .filter((part) => part.wrapper || part.from < part.to);
}

/**
 * Finds code or field content that fully contains the selection.
 * Used before structural rules so local edits can change even protected markup.
 */
export function findLiteralContext(
    state: EditorState,
    tree: SyntaxTree,
    range: TextRange,
    spec: InlineCommandSpec,
): TextRange | undefined {
    const content = readLiteralMarkers(state, range, spec);
    // At a node edge, either side may lead to the enclosing editable field.
    for (const side of [1, -1] as const) {
        for (
            let node: SyntaxNode | null = tree.resolveInner(content.from, side);
            node;
            node = node.parent
        ) {
            const bounds = literalBounds(state, node, spec);
            const selected = node.name === NodeName.URL ? content : range;
            const bareUrl = isBareUrl(node);
            // Whole raw URLs use structural wrapping and optional link normalization.
            const wholeBareUrl =
                bareUrl && !content.wrapper && range.from <= node.from && range.to >= node.to;
            if (!bounds || wholeBareUrl || selected.from < bounds.from || selected.to > bounds.to)
                continue;

            // The URL parser may leave literal style markers outside the URL node.
            if (bareUrl && content.wrapper) {
                return {
                    from: Math.min(bounds.from, content.wrapper.open.from),
                    to: Math.max(bounds.to, content.wrapper.close.to),
                };
            }
            return bounds;
        }
    }
    return undefined;
}

/**
 * Reads a literal style wrapper without crossing the field or code bounds.
 * Used for each part of a selection inside a literal context.
 */
function literalPart(
    state: EditorState,
    bounds: TextRange,
    context: TextRange,
    spec: InlineCommandSpec,
): FormattingPart {
    const part = readLiteralMarkers(state, bounds, spec);
    const wrapper = part.wrapper;
    if (wrapper && (wrapper.open.from < context.from || wrapper.close.to > context.to))
        return {...bounds, literal: true};
    return {...part, literal: true};
}

/**
 * Returns editable text bounds inside code, image markup, or a link/HTML field.
 * Used to find a literal context; inline-code toggles must keep structural rules.
 */
function literalBounds(
    state: EditorState,
    node: SyntaxNode,
    spec: InlineCommandSpec,
): TextRange | undefined {
    if (node.name === NodeName.InlineCode && spec.kind !== 'code') {
        return {from: node.firstChild?.to ?? node.from, to: node.lastChild?.from ?? node.to};
    }
    if (node.name === NodeName.Image) return {from: node.from + 2, to: node.to - 1};
    if (
        node.name === NodeName.URL ||
        node.name === NodeName.LinkTitle ||
        node.name === NodeName.AttributeValue ||
        node.name === NodeName.UnquotedAttributeValue
    ) {
        const text = state.sliceDoc(node.from, node.to);
        const quoted =
            /^['"<]/.test(text) || (node.name === NodeName.LinkTitle && text.startsWith('('));
        return {from: node.from + (quoted ? 1 : 0), to: node.to - (quoted ? 1 : 0)};
    }
    return undefined;
}

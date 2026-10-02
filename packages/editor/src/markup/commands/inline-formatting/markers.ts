import type {EditorState} from '@codemirror/state';

import {getInlineMarkupRange} from '../inline-ranges';

import {NodeName, isBareUrl, isStyleNode, isTextBlock, styleNames} from './syntax';
import type {FormattingPart, InlineCommandSpec, SourceEdit, SyntaxNode, TextRange} from './types';

/** Find style markers around a selection without the syntax tree. Used by word and literal toggles. */
export function readLiteralMarkers(
    state: EditorState,
    bounds: TextRange,
    spec: InlineCommandSpec,
): FormattingPart {
    if (spec.kind !== 'style') return {...bounds};
    for (const {before, after} of markerPairs(spec)) {
        const value = getInlineMarkupRange(state, bounds, before, after);
        if (value.hasMarkupBefore && value.hasMarkupAfter) {
            return {
                from: value.from,
                to: value.to,
                wrapper: {
                    open: {from: value.from - before.length, to: value.from},
                    close: {from: value.to, to: value.to + after.length},
                },
            };
        }
    }
    return {...bounds};
}

/** Choose markers for each new wrapper when building source edits. */
export function chooseMarkers(
    state: EditorState,
    part: FormattingPart,
    spec: InlineCommandSpec,
    urls: SourceEdit[],
): {before: string; after: string} {
    const text = state.sliceDoc(part.from, part.to);
    if (spec.kind === 'code') return codeMarkers(text);
    const canUseAsterisks =
        spec.kind === 'style' && spec.before === '_' && !part.literal && !part.existingMarker;
    if (canUseAsterisks && needsAsterisks(state, part, text, urls)) {
        return {before: '*', after: '*'};
    }
    return {before: spec.before, after: spec.after};
}

/** Find simple unparsed markers so a toggle can remove or complete them. */
export function repairMarkers(
    state: EditorState,
    part: FormattingPart,
    block: TextRange,
    spec: InlineCommandSpec,
    node: SyntaxNode,
): FormattingPart {
    if (spec.kind !== 'style' || part.wrapper || part.literal) return part;
    const {before, after} = spec;
    const text = state.sliceDoc(part.from, part.to);
    // A style without a node mapping can still toggle a complete literal pair.
    if (
        !styleNames[before] &&
        text.startsWith(before) &&
        text.endsWith(after) &&
        text.length >= before.length + after.length
    ) {
        return {
            ...part,
            wrapper: {
                open: {from: part.from, to: part.from + before.length},
                close: {from: part.to - after.length, to: part.to},
            },
        };
    }
    // Repair only one unmatched marker at the edge of the selected block range.
    if (part.from !== block.from || part.to !== block.to || before !== after) return part;
    const extended = {...part};
    if (hasUnparsedMarker(state, node, part.from - before.length, part.from, before))
        extended.from -= before.length;
    if (hasUnparsedMarker(state, node, part.to, part.to + after.length, after))
        extended.to += after.length;
    const extendedText = state.sliceDoc(extended.from, extended.to);
    if (extendedText.split(before).length !== 2) return part;
    if (extendedText.startsWith(before) && !isEscaped(state, extended.from))
        return {...extended, existingMarker: 'open'};
    if (extendedText.endsWith(after) && !isEscaped(state, extended.to - after.length)) {
        // A URL may end with an underscore; it is not always an italic marker.
        if (after === '_' && hasBareUrlEndingAt(node, extended.to - after.length)) return part;
        return {...extended, existingMarker: 'close'};
    }
    return part;
}

/** List marker spellings for the same style when reading literal or empty wrappers. */
export function markerPairs(spec: InlineCommandSpec): {before: string; after: string}[] {
    const markers = [{before: spec.before, after: spec.after}];
    const target = targetNode(spec);
    if (target && spec.kind === 'style') {
        for (const [marker, name] of Object.entries(styleNames)) {
            if (name === target && marker !== spec.before)
                markers.push({before: marker, after: marker});
        }
    }
    return markers;
}

/** Map a command to its syntax node type for structural toggle checks. */
export function targetNode(spec: InlineCommandSpec): NodeName | undefined {
    if (spec.kind === 'code') return NodeName.InlineCode;
    if (spec.kind === 'style') return styleNames[spec.before];
    return undefined;
}

/** Check backslash parity before treating source text as a marker. */
export function isEscaped(state: EditorState, pos: number) {
    let slashes = 0;
    for (let index = pos - 1; index >= 0 && state.sliceDoc(index, index + 1) === '\\'; index--) {
        slashes++;
    }
    return slashes % 2 === 1;
}

/** Choose a safe backtick pair and padding when adding inline code. */
function codeMarkers(text: string): {before: string; after: string} {
    let length = 1;
    // A longer delimiter cannot close on a backtick run inside the content.
    for (const match of text.matchAll(/`+/g)) length = Math.max(length, match[0].length + 1);
    const delimiter = '`'.repeat(length);
    // Separate edge backticks and preserve spaces that the renderer would otherwise remove.
    const needsPadding =
        text.startsWith('`') ||
        text.endsWith('`') ||
        (text.startsWith(' ') && text.endsWith(' ') && /[^ ]/.test(text));
    const padding = needsPadding ? ' ' : '';
    return {before: delimiter + padding, after: padding + delimiter};
}

/** Check where underscores may fail or join nearby markers when adding italic. */
function needsAsterisks(
    state: EditorState,
    part: TextRange,
    text: string,
    urls: SourceEdit[],
): boolean {
    const before = state.sliceDoc(Math.max(0, part.from - 1), part.from);
    const after = state.sliceDoc(part.to, part.to + 1);
    // Underscores cannot mark italic inside words. URL edits add brackets at URL edges.
    return (
        /[\p{L}\p{N}]/u.test(before) ||
        /[\p{L}\p{N}]/u.test(after) ||
        (text.startsWith('_') && !urls.some((url) => url.from === part.from)) ||
        (text.endsWith('_') && !urls.some((url) => url.to === part.to))
    );
}

/** Keep a trailing URL underscore out of incomplete-marker repair. */
function hasBareUrlEndingAt(node: SyntaxNode, pos: number): boolean {
    const cursor = node.cursor();
    while (cursor.next() && cursor.from < node.to) {
        if (cursor.to === pos && isBareUrl(cursor.node)) return true;
    }
    return false;
}

/** Find an adjacent plain marker for repair without crossing block or parsed-node bounds. */
function hasUnparsedMarker(
    state: EditorState,
    node: SyntaxNode,
    from: number,
    to: number,
    marker: string,
): boolean {
    if (
        from < node.from ||
        to > node.to ||
        state.sliceDoc(from, to) !== marker ||
        isEscaped(state, from) ||
        state.sliceDoc(Math.max(0, from - 1), from) === marker[0] ||
        state.sliceDoc(to, to + 1) === marker[marker.length - 1]
    )
        return false;
    // A parsed child owns its markers, even when only its content is selected.
    const inner = node.resolveInner(from, 1);
    if (
        (!isTextBlock(inner) && !isStyleNode(inner) && inner.name !== NodeName.Link) ||
        to > inner.to
    )
        return false;
    const child = inner.childAfter(from);
    return !child || child.from >= to;
}

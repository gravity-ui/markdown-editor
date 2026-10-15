import type {EditorState} from '@codemirror/state';

import {LinkifyFacet} from '../../codemirror/linkify-facet';

import {isBareUrl} from './syntax';
import type {FormattingPart, InlineCommandSpec, SourceEdit, SyntaxTree} from './types';

/**
 * Plans explicit links for fully selected bare URLs when linkify is enabled.
 * Used before adding styles or color; literal edits, code, and math keep raw text.
 */
export function planUrlNormalization(
    state: EditorState,
    tree: SyntaxTree | null,
    parts: FormattingPart[],
    spec: InlineCommandSpec,
): SourceEdit[] {
    if (!tree || !state.facet(LinkifyFacet) || !normalizesUrls(spec)) return [];
    return normalizeUrls(state, tree, parts);
}

/**
 * Replaces covered URL nodes with autolinks or links with an http destination.
 * Used by planUrlNormalization(); all edits refer to the unchanged source.
 */
function normalizeUrls(
    state: EditorState,
    tree: SyntaxTree,
    parts: FormattingPart[],
): SourceEdit[] {
    const edits: SourceEdit[] = [];
    tree.iterate({
        enter: ({node}) => {
            if (!isBareUrl(node)) return;
            const part = parts.find(
                (candidate) =>
                    !candidate.literal && candidate.from <= node.from && candidate.to >= node.to,
            );
            if (!part) return;
            // CodeMirror leaves trailing underscores outside a bare URL.
            const suffix = /^_+/.exec(state.sliceDoc(node.to, part.to))?.[0].length ?? 0;
            const to = node.to + suffix;
            const text = state.sliceDoc(node.from, to);
            // Explicit links keep added closing markers out of the linkified destination.
            const insert = /^(?:[a-z][\w+.-]*:|[^\s@]+@)/i.test(text)
                ? `<${text}>`
                : `[${text}](http://${text})`;
            edits.push({from: node.from, to, insert});
        },
    });
    return edits;
}

/**
 * Checks whether the command needs explicit URLs before adding its markers.
 * Used to limit URL normalization to text styles and color wrappers.
 */
function normalizesUrls(spec: InlineCommandSpec): boolean {
    return spec.kind === 'style' || (spec.kind === 'wrap' && spec.before.startsWith('{'));
}

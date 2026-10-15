import type {EditorState, Line} from '@codemirror/state';

import {NodeName} from './syntax';
import type {SyntaxNode, TextRange} from './types';

const liquidDirectiveLine = /^\{%.*%\}$/;
const directivePrefixes = new Set<string>([
    NodeName.QuoteMark,
    NodeName.ListMark,
    NodeName.TaskMarker,
]);
const inlineContainers = new Set<string>([
    NodeName.InlineCode,
    NodeName.Link,
    NodeName.Image,
    NodeName.Autolink,
    NodeName.HTMLTag,
]);

/** Split structural selection bounds around whole directive lines during multiline formatting. */
export function excludeDirectiveLines(
    state: EditorState,
    node: SyntaxNode,
    bounds: TextRange,
): TextRange[] {
    const ranges: TextRange[] = [];
    let from = bounds.from;
    const first = state.doc.lineAt(bounds.from).number;
    const last = state.doc.lineAt(bounds.to).number;
    for (let number = first; number <= last; number++) {
        const line = state.doc.line(number);
        const contentFrom = lineContentStart(node, line);
        if (
            !isDirectiveLine(state.sliceDoc(contentFrom, line.to)) ||
            isInlineContent(node, contentFrom)
        )
            continue;
        // Keep the line break outside the preceding wrapper and preserve the source line.
        const to = Math.min(bounds.to, line.from - 1);
        if (from < to) ranges.push({from, to});
        from = Math.min(bounds.to, line.to + 1);
    }
    if (from < bounds.to) ranges.push({from, to: bounds.to});
    return ranges;
}

/** Skip only parsed quote, list, and checkbox markers at the start of a source line. */
function lineContentStart(node: SyntaxNode, line: Line): number {
    let container = node;
    // The first prefix can belong to a parent block, outside the text node.
    while (container.parent && container.from > line.from) container = container.parent;
    let pos = line.from;
    while (pos < line.to) {
        if (/^[\t ]$/.test(line.text[pos - line.from])) {
            pos++;
            continue;
        }
        const marker = container.resolveInner(pos, 1);
        if (!directivePrefixes.has(marker.name) || marker.from !== pos) break;
        pos = marker.to;
    }
    return pos;
}

/** Recognize standalone Liquid lines and block directive prefixes, including closing fences. */
function isDirectiveLine(line: string): boolean {
    const text = line.trim();
    return liquidDirectiveLine.test(text) || text.startsWith('::');
}

/** Keep directive-like text inside parsed inline nodes available for whole-node formatting. */
function isInlineContent(node: SyntaxNode, pos: number): boolean {
    for (let inner: SyntaxNode | null = node.resolveInner(pos, 1); inner; inner = inner.parent) {
        if (inlineContainers.has(inner.name)) return true;
    }
    return false;
}

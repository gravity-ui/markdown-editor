import type {EditorState} from '@codemirror/state';

import type {MarkupWrapper, SyntaxNode, TextRange} from './types';

export const enum NodeName {
    StrongEmphasis = 'StrongEmphasis',
    Emphasis = 'Emphasis',
    Strikethrough = 'Strikethrough',
    Underline = 'Underline',
    Monospace = 'Monospace',
    Marked = 'Marked',
    HeaderMark = 'HeaderMark',
    QuoteMark = 'QuoteMark',
    TaskMarker = 'TaskMarker',
    FencedCode = 'FencedCode',
    CodeBlock = 'CodeBlock',
    HTMLBlock = 'HTMLBlock',
    LinkReference = 'LinkReference',
    InlineCode = 'InlineCode',
    Link = 'Link',
    Image = 'Image',
    Autolink = 'Autolink',
    Escape = 'Escape',
    HTMLTag = 'HTMLTag',
    HorizontalRule = 'HorizontalRule',
    ListItem = 'ListItem',
    Blockquote = 'Blockquote',
    LinkMark = 'LinkMark',
    ListMark = 'ListMark',
    CodeMark = 'CodeMark',
    CodeInfo = 'CodeInfo',
    URL = 'URL',
    LinkTitle = 'LinkTitle',
    AttributeValue = 'AttributeValue',
    UnquotedAttributeValue = 'UnquotedAttributeValue',
    Paragraph = 'Paragraph',
    Task = 'Task',
    TableCell = 'TableCell',
    ATXHeading1 = 'ATXHeading1',
    ATXHeading2 = 'ATXHeading2',
    ATXHeading3 = 'ATXHeading3',
    ATXHeading4 = 'ATXHeading4',
    ATXHeading5 = 'ATXHeading5',
    ATXHeading6 = 'ATXHeading6',
    SetextHeading1 = 'SetextHeading1',
    SetextHeading2 = 'SetextHeading2',
}

export const styleNames: Record<string, NodeName> = {
    '**': NodeName.StrongEmphasis,
    __: NodeName.StrongEmphasis,
    '*': NodeName.Emphasis,
    _: NodeName.Emphasis,
    '~~': NodeName.Strikethrough,
    '++': NodeName.Underline,
    '##': NodeName.Monospace,
    '==': NodeName.Marked,
};
const styles = new Set<string>(Object.values(styleNames));
const blockMarkers = new Set<string>([
    NodeName.HeaderMark,
    NodeName.QuoteMark,
    NodeName.TaskMarker,
]);

const atomicNodes = new Set<string>([NodeName.Image, NodeName.Autolink, NodeName.Escape]);
const cursorBlockedNodes = new Set<string>([
    NodeName.InlineCode,
    NodeName.Image,
    NodeName.Autolink,
    NodeName.HTMLTag,
    NodeName.HTMLBlock,
    NodeName.HorizontalRule,
]);
const cursorBlockedMarkers = new Set<string>([
    NodeName.ListMark,
    NodeName.HeaderMark,
    NodeName.QuoteMark,
    NodeName.TaskMarker,
    NodeName.CodeMark,
    NodeName.CodeInfo,
    NodeName.URL,
]);
const textBlocks = new Set<string>([
    NodeName.Paragraph,
    NodeName.Task,
    NodeName.TableCell,
    NodeName.ATXHeading1,
    NodeName.ATXHeading2,
    NodeName.ATXHeading3,
    NodeName.ATXHeading4,
    NodeName.ATXHeading5,
    NodeName.ATXHeading6,
    NodeName.SetextHeading1,
    NodeName.SetextHeading2,
]);

/** Identify supported style wrappers while collecting inline ranges. */
export function isStyleNode(node: SyntaxNode): boolean {
    return styles.has(node.name);
}

/** Identify nodes that a larger selection can only format as a whole. */
export function isAtomicNode(node: SyntaxNode): boolean {
    return atomicNodes.has(node.name);
}

/** Identify fenced and indented code blocks during range collection. */
export function isCodeBlock(node: SyntaxNode): boolean {
    return node.name === NodeName.FencedCode || node.name === NodeName.CodeBlock;
}

/** Find URL nodes outside links, images and autolinks for plain URL handling. */
export function isBareUrl(node: SyntaxNode): boolean {
    if (node.name !== NodeName.URL) return false;
    for (let parent = node.parent; parent; parent = parent.parent) {
        if ([NodeName.Link, NodeName.Image, NodeName.Autolink].some((name) => name === parent.name))
            return false;
    }
    return true;
}

/** Read the source ranges of both markers for toggle removal. Code padding belongs to the markers. */
export function readWrapper(state: EditorState, node: SyntaxNode): MarkupWrapper | undefined {
    const open = node.firstChild;
    const close = node.lastChild;
    if (!open || !close) return undefined;
    let from = open.to;
    let to = close.from;
    if (node.name === NodeName.InlineCode) {
        const content = state.sliceDoc(from, to);
        // The renderer removes one space at each edge unless the content is all spaces.
        if (content.startsWith(' ') && content.endsWith(' ') && /[^ ]/.test(content)) {
            from++;
            to--;
        }
    }
    return {open: {from: node.from, to: from}, close: {from: to, to: node.to}};
}

/** Find the text inside link brackets for partial link selections. */
export function linkLabelRange(state: EditorState, node: SyntaxNode): TextRange {
    const from = node.firstChild?.to ?? node.from;
    for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.name === NodeName.LinkMark && state.sliceDoc(child.from, child.to) === ']') {
            return {from, to: child.from};
        }
    }
    return {from, to: from};
}

/** Find the code body without fence lines for literal formatting. */
export function codeBodyRange(state: EditorState, node: SyntaxNode): TextRange {
    if (node.name === NodeName.CodeBlock) return node;
    const from = Math.min(state.doc.length, state.doc.lineAt(node.from).to + 1);
    const last = node.lastChild;
    const to =
        last?.name === NodeName.CodeMark && last.from > node.from
            ? Math.max(from, state.doc.lineAt(last.from).from)
            : node.to;
    return {from, to};
}

/** Identify blocks whose inline content can be formatted independently. */
export function isTextBlock(node: SyntaxNode) {
    return textBlocks.has(node.name);
}

/** Check whether cursor insertion would change protected Markdown syntax. */
export function isCursorBlocked(state: EditorState, node: SyntaxNode, pos: number): boolean {
    if (node.from < pos && pos < node.to) {
        if (cursorBlockedNodes.has(node.name)) return true;
        if (node.name === NodeName.Link) {
            const label = linkLabelRange(state, node);
            if (pos < label.from || pos > label.to) return true;
        }
    }
    if (
        (isTextBlock(node) ||
            node.name === NodeName.ListItem ||
            node.name === NodeName.Blockquote) &&
        insideBlockPrefix(state, node, pos)
    )
        return true;
    if (node.name === NodeName.LinkMark && node.parent?.name === NodeName.Link) {
        const label = linkLabelRange(state, node.parent);
        if (pos < label.from || pos > label.to) return true;
    }
    return cursorBlockedMarkers.has(node.name) && pos < node.to;
}

/** Remove block markers at selection edges before adding inline markers. */
export function excludeBlockMarkers(
    state: EditorState,
    node: SyntaxNode,
    bounds: TextRange,
    blockNodes: SyntaxNode[] = collectBlockMarkers(node, bounds),
): TextRange {
    let {from, to} = bounds;
    const markers = nodesInRange(blockNodes, bounds);
    // Keep inner quote prefixes so one wrapper can span several quoted lines.
    for (const mark of markers) {
        if (
            mark.from < to &&
            mark.to > from &&
            /^\s*$/.test(state.sliceDoc(from, Math.max(from, mark.from)))
        ) {
            from = Math.min(to, mark.to);
            if (
                mark.name === NodeName.QuoteMark &&
                /^[\t ]$/.test(state.sliceDoc(from, from + 1))
            ) {
                from = Math.min(to, from + 1);
            }
        }
    }
    for (const mark of markers.reverse()) {
        if (
            mark.to > from &&
            mark.from < to &&
            /^\s*$/.test(state.sliceDoc(Math.min(to, mark.to), to))
        ) {
            to = Math.max(from, mark.from);
        }
    }
    return {from, to};
}

/** Read block markers once so ranges split around directives can reuse them. */
export function collectBlockMarkers(node: SyntaxNode, bounds: TextRange): SyntaxNode[] {
    const markers: SyntaxNode[] = [];
    const cursor = node.cursor();
    const end = Math.min(node.to, bounds.to);
    // A node cursor can reach later siblings; keep this scan inside the selected block.
    do {
        if (blockMarkers.has(cursor.name) && cursor.from < bounds.to && cursor.to > bounds.from)
            markers.push(cursor.node);
    } while (cursor.next() && cursor.from < end);
    return markers;
}

/** Read overlapping nodes from sorted, non-overlapping children or block markers. */
export function nodesInRange(nodes: SyntaxNode[], bounds: TextRange): SyntaxNode[] {
    let from = 0;
    let to = nodes.length;
    // Find the first overlap without scanning nodes from earlier source ranges.
    while (from < to) {
        const middle = Math.floor((from + to) / 2);
        if (nodes[middle].to <= bounds.from) from = middle + 1;
        else to = middle;
    }
    const selected: SyntaxNode[] = [];
    for (let index = from; index < nodes.length && nodes[index].from < bounds.to; index++)
        selected.push(nodes[index]);
    return selected;
}

/** Keep outer whitespace outside the markers when collecting text ranges. */
export function trimWhitespace(state: EditorState, {from, to}: TextRange): TextRange {
    const text = state.sliceDoc(from, to);
    const start = from + text.length - text.trimStart().length;
    const end = to - text.length + text.trimEnd().length;
    return {from: start, to: Math.max(start, end)};
}

/** Limit a selection to node content, returning an empty range if they do not overlap. */
export function intersectRanges(range: TextRange, content: TextRange): TextRange {
    const from = Math.max(range.from, content.from);
    return {from, to: Math.max(from, Math.min(range.to, content.to))};
}

/** Check for a nested target style before keeping a whole wrapper in one range. */
export function containsNode(node: SyntaxNode, name?: string): boolean {
    if (!name) return false;
    const cursor = node.cursor();
    while (cursor.next() && cursor.from < node.to) if (cursor.name === name) return true;
    return false;
}

/** Check block markers and their following spaces for cursor protection. */
function insideBlockPrefix(state: EditorState, node: SyntaxNode, pos: number): boolean {
    for (let child = node.firstChild; child; child = child.nextSibling) {
        if (!blockMarkers.has(child.name) && child.name !== NodeName.ListMark) continue;
        const lineEnd = state.doc.lineAt(child.to).to;
        const spaces = /^[\t ]*/.exec(state.sliceDoc(child.to, lineEnd))?.[0].length ?? 0;
        if (pos >= child.from && pos < child.to + spaces) return true;
    }
    return false;
}

import {DataTransferType, isJetBrains, isVSCode, tryCatch} from '@gravity-ui/markdown-editor';
import {type Parser, trackTransactionMetrics} from '@gravity-ui/markdown-editor/core';
import {clipboardUtils} from '@gravity-ui/markdown-editor/extensions';
import {Fragment, type Node, type Schema, Slice} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeSelection, Selection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {singleLine} from './directive';

export type PasteTarget = Pick<Selection, '$from' | '$to'>;

const drops = new WeakMap<EditorView, number>();

type Dragging = NonNullable<EditorView['dragging']> & {node?: NodeSelection};

export const draggedRange = ({dragging, state}: EditorView): Selection | null =>
    dragging && ((dragging as Dragging).node ?? state.selection);

export function trackDrop(view: EditorView, event: DragEvent) {
    const target =
        event.dataTransfer && view.posAtCoords({left: event.clientX, top: event.clientY});
    if (!target) return false;
    const dragged = draggedRange(view);
    if (dragged && !dragged.empty && dragged.from <= target.pos && target.pos <= dragged.to) {
        event.preventDefault();
        return true;
    }
    drops.set(view, target.pos);
    queueMicrotask(() => drops.delete(view));
    return false;
}

export function dropTarget(view: EditorView) {
    const pos = drops.get(view);
    return pos === undefined ? null : view.state.doc.resolve(pos);
}

export const lineText = (content: Fragment) =>
    singleLine(
        content.textBetween(0, content.size, ' ', (leaf) =>
            leaf.type.spec.isBreak ? ' ' : (leaf.type.spec.leafText?.(leaf) ?? ''),
        ),
    );

export const markupSlice = (fragment: Fragment) => {
    const textblock = Boolean(fragment.firstChild?.isTextblock);
    return new Slice(fragment, textblock ? 1 : 0, textblock && fragment.childCount === 1 ? 1 : 0);
};

const plainInline = (node: Node) => node.isText || Boolean(node.type.spec.isBreak);

function inlineMarkdown(content: Fragment) {
    let inline = true;
    content.forEach((node) => {
        const textblock = node.isTextblock && !node.type.spec.code;
        inline &&= plainInline(node) || (textblock && node.children.every(plainInline));
    });
    return inline;
}

export function innerSlice(slice: Slice, unwrap: (node: Node) => boolean = () => true) {
    let {content, openStart, openEnd} = slice;
    let inner = slice;
    while (openStart > 0 && openEnd > 0 && content.firstChild && content.childCount === 1) {
        const node = content.firstChild;
        content = node.content;
        openStart--;
        openEnd--;
        if (unwrap(node)) inner = new Slice(content, openStart, openEnd);
    }
    return inner;
}

export function dropLine(schema: Schema, slice: Slice) {
    const {content} = innerSlice(slice);
    const text = inlineMarkdown(content) && lineText(content);
    return text ? new Slice(Fragment.from(schema.text(text)), 0, 0) : Slice.empty;
}

function pastedLine(parser: Parser, data: DataTransfer) {
    const text = data.getData(DataTransferType.Text);
    if (isVSCode(data) || isJetBrains(data)) return singleLine(text).trim();
    const html = data.getData(DataTransferType.Html);
    const pasted = html ? clipboardUtils.extractTextContentFromHtml(html) : text;
    if (!pasted) return '';
    const parsed = tryCatch(() => parser.parse(pasted));
    const content = parsed.success && parsed.result.content;
    return (content && inlineMarkdown(content) ? lineText(content) : singleLine(pasted)).trim();
}

export function pasteLine(view: EditorView, data: DataTransfer, parser: Parser) {
    if (data.files.length || data.types.includes(DataTransferType.Yfm)) return false;
    const text = pastedLine(parser, data);
    if (!text) return false;
    const {tr, schema} = view.state;
    view.dispatch(
        trackTransactionMetrics(tr.replaceSelectionWith(schema.text(text), false), 'paste', {
            clipboardDataFormat: DataTransferType.Text,
        }).scrollIntoView(),
    );
    return true;
}

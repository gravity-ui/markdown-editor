import {DataTransferType, isJetBrains, isVSCode, tryCatch} from '@gravity-ui/markdown-editor';
import {type Parser, trackTransactionMetrics} from '@gravity-ui/markdown-editor/core';
import {clipboardUtils} from '@gravity-ui/markdown-editor/extensions';
import {type Fragment, type Node, Slice} from '@gravity-ui/markdown-editor/pm/model';
import type {Selection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {isButton} from '../extensions/Button/ButtonSpecs';

import {singleLine} from './directive';

export type PasteTarget = Pick<Selection, '$from' | '$to'>;

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

const plainInline = (node: Node) =>
    node.isText || Boolean(node.type.spec.isBreak) || isButton(node);

function inlineMarkdown(content: Fragment) {
    let inline = true;
    content.forEach((node) => {
        const textblock = node.isTextblock && !node.type.spec.code;
        inline &&= plainInline(node) || (textblock && node.children.every(plainInline));
    });
    return inline;
}

function keepEdgeSpaces(pasted: string, line: string) {
    const text = line.trim();
    const edges = pasted.replace(/^[\r\n]+|[\r\n]+$/g, '');
    return text && `${/^\s/.test(edges) ? ' ' : ''}${text}${/\s$/.test(edges) ? ' ' : ''}`;
}

function pastedLine(parser: Parser, data: DataTransfer) {
    const text = data.getData(DataTransferType.Text);
    if (isVSCode(data) || isJetBrains(data)) return keepEdgeSpaces(text, singleLine(text));
    const html = data.getData(DataTransferType.Html);
    const pasted = html ? clipboardUtils.extractTextContentFromHtml(html) : text;
    if (!pasted) return '';
    const parsed = tryCatch(() => parser.parse(pasted));
    const content = parsed.success && parsed.result.content;
    return keepEdgeSpaces(
        pasted,
        content && inlineMarkdown(content) ? lineText(content) : singleLine(pasted),
    );
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

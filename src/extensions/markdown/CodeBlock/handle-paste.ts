import type {Schema} from 'prosemirror-model';
import type {Transaction} from 'prosemirror-state';
import dd from 'ts-dedent';

import {getLoggerFromState} from '#core';
import type {EditorProps} from '#pm/view';
import {DataTransferType, isVSCode, tryParseVSCodeData} from 'src/utils/clipboard';

import {codeBlockType} from './const';

export type CodePasteData = {
    editor: string;
    value: string;
    inline: boolean;
    mode?: string;
};

type InsertCodeParams = {
    tr: Transaction;
    schema: Schema;
    code: CodePasteData;
    from: number;
    to: number;
    inCodeBlock: boolean;
};

export const handlePaste: NonNullable<EditorProps['handlePaste']> = (view, e) => {
    const data = e.clipboardData;
    if (!data) return false;

    const code = getCodeData(data);
    if (!code) return false;

    const {state} = view;
    const {tr, schema, selection} = state;
    const $from = selection.$from;
    const inCodeBlock = Boolean($from.parent.type.spec.code);

    getLoggerFromState(state).event({
        domEvent: 'paste',
        event: 'paste-from-code-editor',
        editor: code.editor,
        editorMode: code.mode,
        empty: !code.value,
        inline: code.inline,
        dataTypes: Array.from(data.types),
    });

    if (!code.value) {
        return false;
    }

    insertCode({
        tr,
        schema,
        code,
        from: selection.from,
        to: selection.to,
        inCodeBlock,
    });

    view.dispatch(tr.scrollIntoView());
    e.preventDefault();
    return true;
};

export function insertCode({tr, schema, code, from, to, inCodeBlock}: InsertCodeParams): void {
    if (inCodeBlock) {
        tr.insertText(code.value, from, to);
    } else if (code.inline) {
        insertInlineCode(tr, schema, code.value);
    } else {
        insertCodeBlock(tr, schema, code.value);
    }
}

function insertInlineCode(tr: Transaction, schema: Schema, value: string): void {
    const codeMarkType = schema.marks.code;
    const marks = codeMarkType ? [codeMarkType.create()] : undefined;
    const textNode = schema.text(value, marks);
    tr.replaceSelectionWith(textNode, false);
}

function insertCodeBlock(tr: Transaction, schema: Schema, value: string): void {
    const nodeType = codeBlockType(schema);
    const textNode = schema.text(value);
    const codeBlockNode = nodeType.create(null, textNode);
    tr.replaceSelectionWith(codeBlockNode);
}

export function getCodeData(data: DataTransfer): CodePasteData | null {
    const text = data.getData(DataTransferType.Text);
    if (!text) return null;

    if (isVSCode(data)) {
        return processVSCodePaste(data, text);
    }

    const html = data.getData('text/html') || '';
    if (html && (html.includes('<pre') || html.includes('<code'))) {
        return processHtmlPaste(data, text);
    }

    return null;
}

function processVSCodePaste(data: DataTransfer, text: string): CodePasteData {
    const vsCodeData = tryParseVSCodeData(data);
    return {
        editor: 'vscode',
        value: dd(text),
        inline: isInlineCode(text),
        mode: vsCodeData?.mode,
    };
}

function processHtmlPaste(data: DataTransfer, text: string): CodePasteData {
    const html = data.getData('text/html') || '';
    const inline = isInlineCodeFromHtml(html, text);
    return {
        editor: 'code-editor',
        value: inline ? text : dd(text),
        inline,
    };
}

export function isInlineCode(text: string): boolean {
    return !text.includes('\n');
}

function isInlineCodeFromHtml(html: string, text: string): boolean {
    return html.includes('<code') && !html.includes('<pre') && isInlineCode(text);
}

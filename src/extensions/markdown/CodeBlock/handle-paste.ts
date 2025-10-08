import dd from 'ts-dedent';

import {getLoggerFromState} from '#core';
import {Fragment} from '#pm/model';
import type {EditorProps} from '#pm/view';
import {DataTransferType, isVSCode, tryParseVSCodeData} from 'src/utils/clipboard';

import {CodeBlockNodeAttr} from './CodeBlockSpecs';
import {codeBlockType} from './const';

export const handlePaste: NonNullable<EditorProps['handlePaste']> = (view, e) => {
    if (!e.clipboardData || view.state.selection.$from.parent.type.spec.code) return false;
    const code = getCodeData(e.clipboardData);
    if (!code) return false;

    getLoggerFromState(view.state).event({
        domEvent: 'paste',
        event: 'paste-from-code-editor',
        editor: code.editor,
        editorMode: code.mode,
        empty: !code.value,
        dataTypes: e.clipboardData.types,
    });

    const {tr, schema} = view.state;
    if (code.value) {
        const codeBlockNode = codeBlockType(schema).create(
            {[CodeBlockNodeAttr.Lang]: code.mode},
            schema.text(code.value),
        );
        tr.replaceSelectionWith(codeBlockNode);
    } else {
        tr.replaceWith(tr.selection.from, tr.selection.to, Fragment.empty);
    }
    view.dispatch(tr.scrollIntoView());
    return true;
};

function getCodeData(data: DataTransfer): null | {editor: string; mode?: string; value: string} {
    if (data.getData(DataTransferType.Text)) {
        let editor = 'unknown';
        let mode: string | undefined;

        if (isVSCode(data)) {
            editor = 'vscode';
            mode = tryParseVSCodeData(data)?.mode;
        } else return null;

        return {editor, mode, value: dd(data.getData(DataTransferType.Text))};
    }
    return null;
}

import type {EditorProps} from 'prosemirror-view';

import {DataTransferType, isVSCode, tryParseVSCodeData} from '../../../utils/clipboard';

import {CodeBlockNodeAttr} from './CodeBlockSpecs';
import {codeBlockType} from './const';

export const handlePaste: NonNullable<EditorProps['handlePaste']> = (view, e) => {
    if (!e.clipboardData || view.state.selection.$from.parent.type.spec.code) return false;
    const code = getCodeData(e.clipboardData);
    if (!code) return false;
    let tr = view.state.tr;
    const {schema} = tr.doc.type;
    const codeBlockNode = codeBlockType(schema).create(
        {[CodeBlockNodeAttr.Lang]: code.mode},
        schema.text(code.value),
    );
    tr = tr.replaceSelectionWith(codeBlockNode);
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

        return {editor, mode, value: data.getData(DataTransferType.Text)};
    }
    return null;
}

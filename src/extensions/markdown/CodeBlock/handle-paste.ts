import type {EditorProps} from 'prosemirror-view';
import {DataTransferType} from '../../behavior/Clipboard/utils';
import {cbType, langAttr} from './const';

export const handlePaste: NonNullable<EditorProps['handlePaste']> = (view, e) => {
    if (!e.clipboardData || view.state.selection.$from.parent.type.spec.code) return false;
    const code = getCodeData(e.clipboardData);
    if (!code) return false;
    let tr = view.state.tr;
    const {schema} = tr.doc.type;
    const codeBlockNode = cbType(schema).create({[langAttr]: code.mode}, schema.text(code.value));
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
            mode = tryCatch<VSCodeData>(() =>
                JSON.parse(data.getData(DataTransferType.VSCodeData)),
            )?.mode;
        } else return null;

        return {editor, mode, value: data.getData(DataTransferType.Text)};
    }
    return null;
}

type VSCodeData = {
    version: number;
    isFromEmptySelection: boolean;
    multicursorText: null | string;
    mode: string;
    [key: string]: unknown;
};

function isVSCode(data: DataTransfer): boolean {
    return data.types.includes(DataTransferType.VSCodeData);
}

function tryCatch<R>(fn: () => R): R | undefined {
    try {
        return fn();
    } catch (e) {
        console.error(e);
    }
    return undefined;
}

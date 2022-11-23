/* eslint-disable no-implicit-globals */
import type {EditorView} from 'prosemirror-view';
import {DataTransferType as DTType} from '../src/extensions/behavior/Clipboard/utils';
import {ClipboardEventMock, DataTransferMock} from './event-mock';

export function dispatchPasteEvent(view: EditorView, data: {[K in DTType]?: string}): void;
export function dispatchPasteEvent(view: EditorView, data: Record<string, string>): void {
    const clipboardData = new DataTransferMock();
    for (const [key, value] of Object.entries(data)) {
        clipboardData.setData(key, value);
    }
    view.dispatchEvent(new ClipboardEventMock('paste', {clipboardData}));
}

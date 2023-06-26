import type {Slice} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

declare module 'prosemirror-view' {
    type SerializeForClipboard = (
        view: EditorView,
        slice: Slice,
    ) => {dom: HTMLElement; text: string};

    // internal export
    export const __serializeForClipboard: SerializeForClipboard;
}

import {__serializeForClipboard} from 'prosemirror-view';

if (!__serializeForClipboard)
    throw new Error('__serializeForClipboard not exported from prosemirror-view module.');

export {__serializeForClipboard as serializeForClipboard};

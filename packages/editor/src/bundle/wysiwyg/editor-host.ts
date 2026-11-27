import type {EditorHost} from 'src/bundle/shared/editor-host';
import type {ActionStorage, WysiwygEditor} from 'src/core';

/** @internal */
export interface WysiwygEditorHost extends EditorHost, ActionStorage {
    readonly wysiwygEditor: WysiwygEditor;
}

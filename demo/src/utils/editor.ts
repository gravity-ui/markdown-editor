import type {
    MarkdownEditorInstance,
    MarkdownWysiwygEditorInstance,
} from '@gravity-ui/markdown-editor';
// @ts-expect-error Internal declarations are removed from the package build.
import {getWysiwygBinding} from '@gravity-ui/markdown-editor/_/bundle/wysiwyg/binding.js';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

export type PlaygroundEditor = MarkdownEditorInstance | MarkdownWysiwygEditorInstance;

type SelectionEvents = {
    on(event: 'rerender-toolbar', listener: () => void): void;
    off(event: 'rerender-toolbar', listener: () => void): void;
};

type StandaloneBinding = SelectionEvents & {readonly wysiwygEditor: {readonly view: EditorView}};
type DualModeEditor = MarkdownEditorInstance &
    SelectionEvents & {readonly _wysiwygView?: EditorView};

// Keep the untyped internal import at this boundary.
const getBinding: (editor: MarkdownWysiwygEditorInstance) => StandaloneBinding = getWysiwygBinding;

export function getWysiwygView(editor: PlaygroundEditor): EditorView | undefined {
    if ('currentMode' in editor) {
        return editor.currentMode === 'wysiwyg'
            ? (editor as DualModeEditor)._wysiwygView
            : undefined;
    }
    return getBinding(editor).wysiwygEditor.view;
}

export function subscribeToSelection(editor: PlaygroundEditor, listener: () => void): () => void {
    const owner: SelectionEvents =
        'currentMode' in editor ? (editor as DualModeEditor) : getBinding(editor);
    owner.on('rerender-toolbar', listener);
    return () => owner.off('rerender-toolbar', listener);
}

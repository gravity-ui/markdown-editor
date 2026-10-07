import {useEffect} from 'react';

import type {MarkdownEditorInstance} from '@gravity-ui/markdown-editor';

declare global {
    interface Window {
        mdEditor?: MarkdownEditorInstance;
    }
}

/** Visual tests and the browser console reach the mounted editor through this handle */
export function useEditorHandle(editor: MarkdownEditorInstance) {
    useEffect(() => {
        const previous = window.mdEditor;
        window.mdEditor = editor;

        return () => {
            if (window.mdEditor !== editor) return;

            // several editors can be mounted at once, so unmounting hands the handle back
            window.mdEditor = previous;
        };
    }, [editor]);
}

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
        window.mdEditor = editor;

        return () => {
            if (window.mdEditor === editor) {
                delete window.mdEditor;
            }
        };
    }, [editor]);
}

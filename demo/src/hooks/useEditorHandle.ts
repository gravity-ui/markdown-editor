import {useEffect} from 'react';

import type {MarkdownEditorInstance} from '@gravity-ui/markdown-editor';

declare global {
    interface Window {
        mdEditor?: MarkdownEditorInstance;
    }
}

/** Mount order; several editors can be mounted at once */
const mounted: MarkdownEditorInstance[] = [];

/** Visual tests and the browser console reach the editor mounted last through this handle */
export function useEditorHandle(editor: MarkdownEditorInstance) {
    useEffect(() => {
        mounted.push(editor);
        window.mdEditor = editor;

        return () => {
            const index = mounted.lastIndexOf(editor);
            if (index !== -1) mounted.splice(index, 1);

            window.mdEditor = mounted.at(-1);
        };
    }, [editor]);
}

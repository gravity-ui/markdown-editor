import {useEffect} from 'react';

import type {PlaygroundEditor} from '../utils/editor';

declare global {
    interface Window {
        mdEditor?: PlaygroundEditor;
    }
}

/** Mount order; several editors can be mounted at once */
const mounted: PlaygroundEditor[] = [];

/** Visual tests and the browser console reach the editor mounted last through this handle */
export function useEditorHandle(editor?: PlaygroundEditor) {
    useEffect(() => {
        if (!editor) return undefined;
        mounted.push(editor);
        window.mdEditor = editor;

        return () => {
            const index = mounted.lastIndexOf(editor);
            if (index !== -1) mounted.splice(index, 1);

            window.mdEditor = mounted.at(-1);
        };
    }, [editor]);
}

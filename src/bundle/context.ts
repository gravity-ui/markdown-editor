import {createContext, useContext} from 'react';

import type {Editor} from './Editor';

const EditorContext = createContext<Editor | null>(null);

export const MarkdownEditorProvider = EditorContext.Provider;
export function useMarkdownEditorContext() {
    return useContext(EditorContext);
}

import {createContext, useContext} from 'react';

import type {MarkdownEditorInstance} from './editor-public-types';

const EditorContext = createContext<MarkdownEditorInstance | null>(null);

export const MarkdownEditorProvider = EditorContext.Provider;
export function useMarkdownEditorContext() {
    return useContext(EditorContext);
}

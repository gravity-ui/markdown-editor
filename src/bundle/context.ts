import {createContext, useContext} from 'react';

import {Editor} from './Editor';

const EditorContext = createContext<Editor | null>(null);

export const YfmEditorProvider = EditorContext.Provider;
export function useYfmEditorContext() {
    return useContext(EditorContext);
}

import {createContext, useContext} from 'react';

import type {MarkdownWysiwygEditorInstance} from 'src/bundle/wysiwyg/public/types';

const WysiwygEditorContext = createContext<MarkdownWysiwygEditorInstance | null>(null);

export const MarkdownWysiwygEditorProvider = WysiwygEditorContext.Provider;

export function useMarkdownWysiwygEditorContext(): MarkdownWysiwygEditorInstance | null {
    return useContext(WysiwygEditorContext);
}

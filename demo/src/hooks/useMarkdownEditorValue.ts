import {useEffect, useState} from 'react';

import {
    type MarkdownWysiwygEditorInstance,
    type MarkupString,
    useDebounce,
} from '@gravity-ui/markdown-editor';

export function useMarkdownEditorValue(
    editor?: Pick<MarkdownWysiwygEditorInstance, 'getValue' | 'on' | 'off'>,
    delay = 500,
): MarkupString {
    const [value, setValue] = useState(() => editor?.getValue() ?? '');

    const fn = useDebounce(() => setValue(editor?.getValue() ?? ''), delay);

    useEffect(() => {
        if (!editor) return undefined;
        setValue(editor.getValue());
        editor.on('change', fn);
        return () => {
            editor.off('change', fn);
        };
    }, [editor, fn]);

    return editor ? value : '';
}

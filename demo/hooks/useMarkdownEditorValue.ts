import {useEffect, useState} from 'react';

import {type MarkdownEditorInstance, type MarkupString, useDebounce} from 'src/index';

export function useMarkdownEditorValue(editor: MarkdownEditorInstance, delay = 500): MarkupString {
    const [value, setValue] = useState(() => editor.getValue());

    const fn = useDebounce(() => setValue(editor.getValue()), delay);

    useEffect(() => {
        editor.on('change', fn);
        return () => {
            editor.off('change', fn);
        };
    }, [editor, fn]);

    return value;
}

import {useLayoutEffect, useState} from 'react';

import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {useUpdate} from 'react-use';

import {type PlaygroundEditor, getWysiwygView} from '../utils/editor';

export function useWysiwygEditorView(editor: PlaygroundEditor): EditorView | undefined {
    const [state, setState] = useState<{editor: PlaygroundEditor; view?: EditorView}>();
    const rerender = useUpdate();
    const mode = 'currentMode' in editor ? editor.currentMode : 'wysiwyg';

    useLayoutEffect(() => {
        if (!('currentMode' in editor)) return undefined;
        editor.on('change-editor-mode', rerender);
        return () => editor.off('change-editor-mode', rerender);
    }, [editor, rerender]);

    useLayoutEffect(() => {
        // Read the view after the editor renders its new mode.
        setState({editor, view: getWysiwygView(editor)});
    }, [editor, mode]);

    return mode === 'wysiwyg' && state?.editor === editor ? state.view : undefined;
}

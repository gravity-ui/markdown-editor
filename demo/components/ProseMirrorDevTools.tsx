import {useEffect, useLayoutEffect} from 'react';

import {applyDevTools, removeDevTools} from 'prosemirror-dev-toolkit';
import {useEffectOnce, useUpdate} from 'react-use';

import type {EditorView} from '#pm/view';
import type {MarkdownEditorInstance} from 'src/index';

export type WysiwygDevToolsProps = {
    editor: MarkdownEditorInstance;
};

export function WysiwygDevTools({editor}: WysiwygDevToolsProps) {
    const rerender = useUpdate();
    useEffectOnce(() => {
        rerender();
    });

    const view = editor?.currentMode === 'wysiwyg' && editor._wysiwygView;

    useLayoutEffect(() => {
        if (!editor) return undefined;
        editor.on('change-editor-mode', rerender);
        return () => {
            editor.off('change-editor-mode', rerender);
        };
    }, [editor, rerender]);

    if (!view) return null;

    return <ProseMirrorDevTools view={view} />;
}

type ProseMirrorDevToolsProps = {
    view: EditorView;
};

function ProseMirrorDevTools({view}: ProseMirrorDevToolsProps) {
    useEffect(() => {
        applyDevTools(view);
        return () => {
            removeDevTools();
        };
    }, [view]);

    return null;
}

import React from 'react';

import {applyDevTools, removeDevTools} from 'prosemirror-dev-toolkit';
import {EditorView} from 'prosemirror-view';
import {useEffectOnce, useUpdate} from 'react-use';

import type {Editor} from '../src/bundle';

export type WysiwygDevToolsProps = {
    editorRef: React.RefObject<Editor>;
};

export function WysiwygDevTools({editorRef}: WysiwygDevToolsProps) {
    const rerender = useUpdate();
    useEffectOnce(() => {
        rerender();
    });

    const editor = editorRef.current;
    const view = editor?.currentType === 'wysiwyg' && editor._wysiwygView;

    React.useLayoutEffect(() => {
        if (!editor) return undefined;
        editor.on('change-editor-type', rerender);
        return () => {
            editor.off('change-editor-type', rerender);
        };
    }, [editor, rerender]);

    if (!view) return null;

    return <ProseMirrorDevTools view={view} />;
}

type ProseMirrorDevToolsProps = {
    view: EditorView;
};

function ProseMirrorDevTools({view}: ProseMirrorDevToolsProps) {
    React.useEffect(() => {
        applyDevTools(view);
        return () => {
            removeDevTools();
        };
    }, [view]);

    return null;
}

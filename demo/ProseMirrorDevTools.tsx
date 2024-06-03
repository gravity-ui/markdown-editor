import React from 'react';

import {applyDevTools, removeDevTools} from 'prosemirror-dev-toolkit';
import {EditorView} from 'prosemirror-view';
import {useEffectOnce, useUpdate} from 'react-use';

import type {Editor} from '../src/bundle';

export type WysiwygDevToolsProps = {
    editor: Editor;
};

export function WysiwygDevTools({editor}: WysiwygDevToolsProps) {
    const rerender = useUpdate();
    useEffectOnce(() => {
        rerender();
    });

    const view = editor?.currentMode === 'wysiwyg' && editor._wysiwygView;

    React.useLayoutEffect(() => {
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
    React.useEffect(() => {
        applyDevTools(view);
        return () => {
            removeDevTools();
        };
    }, [view]);

    return null;
}

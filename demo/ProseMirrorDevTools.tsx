import {useEffect} from 'react';
import type {EditorView} from 'prosemirror-view';
import {applyDevTools, removeDevTools} from 'prosemirror-dev-toolkit';

export type ProseMirrorDevToolsProps = {
    view: EditorView;
};

export function ProseMirrorDevTools({view}: ProseMirrorDevToolsProps) {
    useEffect(() => {
        applyDevTools(view);
        return () => {
            removeDevTools();
        };
    }, [view]);
    return null;
}

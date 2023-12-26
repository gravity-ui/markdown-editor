import {useEffect} from 'react';

import {applyDevTools, removeDevTools} from 'prosemirror-dev-toolkit';
import type {EditorView} from 'prosemirror-view';

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

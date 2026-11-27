import {useEffect} from 'react';

import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {useWysiwygEditorView} from '../hooks/useWysiwygEditorView';
import type {PlaygroundEditor} from '../utils/editor';

export type WysiwygDevToolsProps = {
    editor: PlaygroundEditor;
};

/** The toolkit serializes both documents and diffs them on every transaction */
export function WysiwygDevTools({editor}: WysiwygDevToolsProps) {
    const view = useWysiwygEditorView(editor);

    if (!view) return null;

    return <ProseMirrorDevTools view={view} />;
}

type ProseMirrorDevToolsProps = {
    view: EditorView;
};

function ProseMirrorDevTools({view}: ProseMirrorDevToolsProps) {
    useEffect(() => {
        let unmounted = false;
        let dispose: (() => void) | undefined;

        // Keeps the toolkit out of the entry bundle of pages that render the editor without dev tools
        import('prosemirror-dev-toolkit').then(({applyDevTools, removeDevTools}) => {
            if (unmounted) return;
            applyDevTools(view);
            dispose = removeDevTools;
        });

        return () => {
            unmounted = true;
            dispose?.();
        };
    }, [view]);

    return null;
}

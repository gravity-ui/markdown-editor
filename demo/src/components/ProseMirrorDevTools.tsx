import {useEffect, useLayoutEffect} from 'react';

import type {MarkdownEditorInstance} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {useEffectOnce, useUpdate} from 'react-use';

export type WysiwygDevToolsProps = {
    editor: MarkdownEditorInstance;
};

/** The toolkit serializes both documents and diffs them on every transaction */
export function WysiwygDevTools({editor}: WysiwygDevToolsProps) {
    const rerender = useUpdate();
    useEffectOnce(() => {
        rerender();
    });

    const view =
        editor?.currentMode === 'wysiwyg' &&
        // @ts-expect-error
        editor._wysiwygView;

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

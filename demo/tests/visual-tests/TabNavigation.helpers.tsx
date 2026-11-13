import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

import {useEditorHandle} from '../../src/hooks/useEditorHandle';

export function TabNavigation({
    mode,
    enableTabExitOnEscape = true,
}: {
    mode: MarkdownEditorMode;
    enableTabExitOnEscape?: boolean;
}) {
    const editor = useMarkdownEditor({
        initial: {markup: 'Text', mode, toolbarVisible: false},
        enableTabExitOnEscape,
    });

    useEditorHandle(editor);

    return (
        <div style={{width: 600}}>
            <button type="button">Before editor</button>
            <MarkdownEditorView
                editor={editor}
                qa="demo-md-editor"
                settingsVisible={false}
                stickyToolbar={false}
            />
            <button type="button">After editor</button>
        </div>
    );
}

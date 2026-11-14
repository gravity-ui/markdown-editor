import {useCallback, useEffect} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {Button, Header} from '@gravity-ui/markdown-editor-header-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {toolbars} from '../header/Header';

export function ButtonExample({
    initial = ':button[Кнопка]{href="https://example.com" view="action" color="standard"}',
    mode = 'wysiwyg',
    width = 660,
    preview = false,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
    /** Opens the preview of the markup mode in place of the source. */
    preview?: boolean;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Header, {}).use(Button)},
        markupConfig: {renderPreview},
    });
    useEffect(() => {
        if (preview) editor.changePreviewVisible(true);
    }, [editor, preview]);

    return (
        <PlaygroundLayout
            editor={editor}
            viewWidth={width}
            view={({className}) => (
                <MarkdownEditorView
                    qa="demo-md-editor"
                    className={className}
                    editor={editor}
                    toolbarsPreset={toolbars}
                    stickyToolbar={false}
                />
            )}
        />
    );
}

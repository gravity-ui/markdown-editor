import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {Button} from '@gravity-ui/markdown-editor-header-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';

export function ButtonExample({
    initial = ':::button{href="https://example.com"}\nКнопка\n:::',
    mode = 'wysiwyg',
    width = 660,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Button)},
        markupConfig: {renderPreview},
    });

    return (
        <PlaygroundLayout
            editor={editor}
            viewWidth={width}
            view={({className}) => (
                <MarkdownEditorView
                    qa="demo-md-editor"
                    className={className}
                    editor={editor}
                    stickyToolbar={false}
                />
            )}
        />
    );
}

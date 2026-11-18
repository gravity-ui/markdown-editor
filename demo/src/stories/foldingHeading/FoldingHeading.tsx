import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName as Action, ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';
import {
    FoldingHeading,
    toolbarFoldingHeadingItem,
} from '@gravity-ui/markdown-editor-folding-heading-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';

const foldingHeading = 'foldingHeading';

const toolbars = {
    items: {
        ...full.items,
        [foldingHeading]: toolbarFoldingHeadingItem,
    },
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygSelection]: [[foldingHeading, Action.text]],
    },
};

export function FoldingHeadingExample({
    initial = '##+ Collapsed section\n\nThe text under the heading',
    mode = 'wysiwyg',
    width = 1000,
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
        initial: {markup: initial, mode},
        wysiwygConfig: {extensions: (builder) => builder.use(FoldingHeading)},
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
                    toolbarsPreset={toolbars}
                    stickyToolbar={false}
                />
            )}
        />
    );
}

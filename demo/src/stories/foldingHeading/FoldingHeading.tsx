import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName as Action, ToolbarName, commonmark} from '@gravity-ui/markdown-editor/toolbars';
import {
    FoldingHeading,
    toolbarFoldingHeadingItem,
} from '@gravity-ui/markdown-editor-folding-heading-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';

const foldingHeading = 'foldingHeading';

const toolbars: ToolbarsPreset = {
    items: {
        ...commonmark.items,
        [foldingHeading]: toolbarFoldingHeadingItem,
    },
    orders: {
        ...commonmark.orders,
        [ToolbarName.wysiwygMain]: [
            ...commonmark.orders[ToolbarName.wysiwygMain],
            [foldingHeading],
        ],
        [ToolbarName.wysiwygHidden]: [],
        [ToolbarName.markupHidden]: [],
        [ToolbarName.wysiwygSelection]: [
            [foldingHeading, Action.text],
            ...commonmark.orders[ToolbarName.wysiwygSelection].slice(1),
        ],
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

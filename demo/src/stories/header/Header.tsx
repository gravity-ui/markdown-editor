import {type CSSProperties, useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';
import {Header, headerItem} from '@gravity-ui/markdown-editor-header-extension';

import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {useEditorHandle} from '../../hooks/useEditorHandle';

const toolbars = {
    items: {...full.items, header: headerItem},
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygHidden]: [[...full.orders[ToolbarName.wysiwygHidden].flat(), 'header']],
        [ToolbarName.markupHidden]: [[...full.orders[ToolbarName.markupHidden].flat(), 'header']],
    },
};

export function HeaderExample({
    initial = ':::header{height="s" width="m"}\n:::\n\nAfter',
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
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {extensions: (builder) => builder.use(Header)},
        markupConfig: {renderPreview},
    });
    useEditorHandle(editor);
    return (
        // The drag handle is placed in the editor padding to the left of the block.
        <div style={{width, maxWidth: '100%', '--g-md-editor-padding': '0 20px'} as CSSProperties}>
            <MarkdownEditorView editor={editor} toolbarsPreset={toolbars} stickyToolbar={false} />
        </div>
    );
}

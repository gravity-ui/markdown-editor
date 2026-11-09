import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName as Action, ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';
import {Header, toolbarHeaderItem} from '@gravity-ui/markdown-editor-header-extension';

import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {useEditorHandle} from '../../hooks/useEditorHandle';

const mainToolbar = [
    [Action.undo, Action.redo],
    [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono, Action.mark],
    [Action.link],
    ['header'],
];

const toolbars = {
    items: {
        ...full.items,
        header: toolbarHeaderItem,
    },
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygMain]: mainToolbar,
        [ToolbarName.markupMain]: mainToolbar,
        [ToolbarName.wysiwygHidden]: [],
        [ToolbarName.markupHidden]: [],
    },
};

export function HeaderExample({
    initial = ':::header{height="s" width="m"}\n\n:::\n\nAfter',
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
        <div style={{width, maxWidth: '100%'}}>
            <MarkdownEditorView editor={editor} toolbarsPreset={toolbars} stickyToolbar={false} />
        </div>
    );
}

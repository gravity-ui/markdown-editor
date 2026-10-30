import {useCallback} from 'react';

import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';
import {Header, headerItem} from '@gravity-ui/markdown-editor-header-extension';

import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {useEditorHandle} from '../../hooks/useEditorHandle';

const toolbars = {
    items: {...full.items, header: headerItem},
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygMain]: [['header'], ...full.orders[ToolbarName.wysiwygMain]],
        [ToolbarName.markupMain]: [['header'], ...full.orders[ToolbarName.markupMain]],
    },
};

export function HeaderExample({
    initial = ':::header{height="s" width="m"}\n:::\n\nAfter',
    mode = 'wysiwyg',
    width = 1000,
    readonly = false,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
    readonly?: boolean;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        wysiwygConfig: {
            extensions: (builder) =>
                builder
                    .use(Header)
                    .addPlugin(() => new Plugin({props: {editable: () => !readonly}})),
        },
        markupConfig: {renderPreview},
    });
    useEditorHandle(editor);
    return (
        <div style={{width, maxWidth: '100%'}}>
            <MarkdownEditorView editor={editor} toolbarsPreset={toolbars} stickyToolbar={false} />
        </div>
    );
}

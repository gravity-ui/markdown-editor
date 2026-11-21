import {type CSSProperties, useCallback, useEffect} from 'react';

import {
    type FileUploadHandler,
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName as Action, ToolbarName, full} from '@gravity-ui/markdown-editor/toolbars';
import {
    Banner,
    Button,
    toolbarBannerItem,
    toolbarButtonItem,
} from '@gravity-ui/markdown-editor-banner-extension';

import {PlaygroundLayout} from '../../src/components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../src/components/SplitModePreviewLazy';

import {UPLOADED_IMAGE, bannerUploadLimits} from './utils/banner-upload';
import {composeStories} from './utils/compose-stories';

const mainToolbar = [
    [Action.undo, Action.redo],
    [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono, Action.mark],
    [Action.link],
    ['banner', 'button'],
];

const wysiwygMarkup = `:::banner

::banner-image{src="assets/banner-image-landscape.svg" alt="Team"}

::banner-title[Team portal]

:::banner-content
Portal description.
:::

:button[Button 1]{href="https://example.com" view="action" color="blue"}

:::

After`;

const fileUploadHandler: FileUploadHandler = async () => ({url: UPLOADED_IMAGE});

const toolbars = {
    items: {
        ...full.items,
        banner: toolbarBannerItem,
        button: toolbarButtonItem,
    },
    orders: {
        ...full.orders,
        [ToolbarName.wysiwygMain]: mainToolbar,
        [ToolbarName.markupMain]: mainToolbar,
        [ToolbarName.wysiwygHidden]: [],
        [ToolbarName.markupHidden]: [],
    },
};

export function BannerExample({
    initial = ':::banner{height="s" width="m"}\n\n:::\n\nAfter',
    mode = 'wysiwyg',
    width = 1000,
    preview = false,
    uploadFile = fileUploadHandler,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: CSSProperties['width'];
    preview?: boolean;
    uploadFile?: FileUploadHandler;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        handlers: {uploadFile},
        wysiwygConfig: {
            extensions: (builder) =>
                builder
                    .use(Banner, {...bannerUploadLimits, fileUploadHandler: uploadFile})
                    .use(Button),
        },
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

export const BannerStories = composeStories({
    default: {component: BannerExample},
    Banner: {},
    Preview: {args: {mode: 'markup', preview: true, width: 1000}},
    Wysiwyg: {args: {mode: 'wysiwyg', width: 1000, initial: wysiwygMarkup}},
});

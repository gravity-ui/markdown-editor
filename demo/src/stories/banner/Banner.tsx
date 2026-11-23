import {useCallback} from 'react';

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
    type BannerOptions,
    Button,
    toolbarBannerItem,
} from '@gravity-ui/markdown-editor-banner-extension';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {randomDelay} from '../../utils/delay';

const mainToolbar = [
    [Action.undo, Action.redo],
    [Action.bold, Action.italic, Action.underline, Action.strike, Action.mono, Action.mark],
    [Action.link],
    ['banner'],
];

const fileUploadHandler: FileUploadHandler = async (file) => {
    console.info('[Banner] Uploading file: ' + file.name);
    await randomDelay(1000, 3000);
    return {url: URL.createObjectURL(file)};
};

const imageLimits = {
    imageTypes: ['image/jpeg', 'image/gif', 'image/png'],
    maxImageSize: 2 * 1024 * 1024,
} satisfies BannerOptions;

export const toolbars = {
    items: {
        ...full.items,
        banner: toolbarBannerItem,
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
    width,
    uploadFile = fileUploadHandler,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
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
                builder.use(Banner, {...imageLimits, fileUploadHandler: uploadFile}).use(Button),
        },
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

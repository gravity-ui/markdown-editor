import {type CSSProperties, useCallback} from 'react';

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

:button[Button 1](https://example.com){view="action" color="blue"}

:::

After`;

const fileUploadHandler: FileUploadHandler = async () => ({url: '/assets/banner-forest-lake.jpg'});

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
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: CSSProperties['width'];
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />,
        [],
    );
    const editor = useMarkdownEditor({
        initial: {markup: initial, mode, toolbarVisible: true},
        handlers: {uploadFile: fileUploadHandler},
        wysiwygConfig: {
            extensions: (builder) =>
                builder
                    .use(Banner, {
                        imageTypes: ['image/jpeg', 'image/gif', 'image/png'],
                        maxImageSize: 2 * 1024 * 1024,
                    })
                    .use(Button),
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

export const BannerStories = composeStories({
    default: {component: BannerExample},
    Banner: {},
    Wysiwyg: {args: {initial: wysiwygMarkup}},
});

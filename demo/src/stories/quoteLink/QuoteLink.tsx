import {memo, useCallback} from 'react';

import {transform as quoteLinkPlugin} from '@diplodoc/quote-link-extension';
import {
    type MarkdownEditorMode,
    MarkdownEditorView,
    type RenderPreview,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName as Toolbar, commonmark} from '@gravity-ui/markdown-editor/toolbars';
import {
    QuoteLink as QuoteLinkExtension,
    toolbarQuoteLinkItem,
} from '@gravity-ui/markdown-editor-quote-link-extension';
import type {PluginWithParams} from 'markdown-it/lib';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {useLogs} from '../../hooks/useLogs';

const extraPlugins: PluginWithParams[] = [quoteLinkPlugin({bundle: false})];

const quoteLink = 'quoteLink';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...commonmark.items,
        [quoteLink]: toolbarQuoteLinkItem,
    },
    orders: {
        ...commonmark.orders,
        [Toolbar.wysiwygMain]: [...commonmark.orders[Toolbar.wysiwygMain], [quoteLink]],
        [Toolbar.markupMain]: [...commonmark.orders[Toolbar.markupMain], [quoteLink]],
        [Toolbar.wysiwygHidden]: [],
        [Toolbar.markupHidden]: [],
    },
};

export const QuoteLink = memo(function QuoteLink({
    initial = '',
    mode,
    width,
    height,
}: {
    initial?: string;
    mode?: MarkdownEditorMode;
    width?: number;
    height?: number;
}) {
    const renderPreview = useCallback<RenderPreview>(
        ({getValue, md}) => (
            <SplitModePreviewLazy
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml
                extraPlugins={extraPlugins}
            />
        ),
        [],
    );

    const editor = useMarkdownEditor({
        initial: {markup: initial, mode},
        markupConfig: {renderPreview},
        wysiwygConfig: {
            extensions: QuoteLinkExtension,
            extensionOptions: {
                yfmConfigs: {
                    attrs: {
                        allowedAttributes: ['data-quotelink'],
                    },
                },
            },
        },
    });

    useLogs(editor.logger);

    return (
        <PlaygroundLayout
            editor={editor}
            viewWidth={width}
            viewHeight={height}
            view={({className}) => (
                <MarkdownEditorView
                    qa="demo-md-editor"
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                    toolbarsPreset={toolbarsPreset}
                />
            )}
        />
    );
});

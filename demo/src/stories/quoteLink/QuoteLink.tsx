import {memo, useCallback} from 'react';

import {transform as quoteLink} from '@diplodoc/quote-link-extension';
import {
    MarkdownEditorView,
    type RenderPreview,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {QuoteLink as QuoteLinkExtension} from '@gravity-ui/markdown-editor/extensions/additional/QuoteLink/index.js';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    defaultPreset,
    quoteLinkItemMarkup,
    quoteLinkItemView,
    quoteLinkItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';
import type {PluginWithParams} from 'markdown-it/lib';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {useLogs} from '../../hooks/useLogs';

const extraPlugins: PluginWithParams[] = [quoteLink({bundle: false})];

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...defaultPreset.items,
        [Action.quoteLink]: {
            view: quoteLinkItemView,
            wysiwyg: quoteLinkItemWysiwyg,
            markup: quoteLinkItemMarkup,
        },
    },
    orders: {
        [Toolbar.wysiwygMain]: [[Action.quoteLink], ...defaultPreset.orders[Toolbar.wysiwygMain]],
        [Toolbar.markupMain]: [[Action.quoteLink], ...defaultPreset.orders[Toolbar.markupMain]],
    },
};

export const QuoteLink = memo(() => {
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
        initial: {markup: ''},
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
            view={({className}) => (
                <MarkdownEditorView
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

QuoteLink.displayName = 'GPT';

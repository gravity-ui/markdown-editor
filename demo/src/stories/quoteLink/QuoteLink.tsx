import {memo, useCallback} from 'react';

import {transform as quoteLink} from '@diplodoc/quote-link-extension';
import {
    MarkdownEditorView,
    type RenderPreview,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {ActionName as Action} from '@gravity-ui/markdown-editor/_/bundle/config/action-names.js';
import {ToolbarName as Toolbar} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {
    quoteLinkItemMarkup,
    quoteLinkItemView,
    quoteLinkItemWysiwyg,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/items.js';
import {defaultPreset} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';
import {QuoteLink as QuoteLinkExtension} from '@gravity-ui/markdown-editor/extensions/additional/QuoteLink/index.js';
import type {PluginWithParams} from 'markdown-it/lib';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreview} from '../../components/SplitModePreview';
import {plugins as defaultPlugins} from '../../defaults/md-plugins';
import {useLogs} from '../../hooks/useLogs';

const plugins: PluginWithParams[] = [...defaultPlugins, quoteLink({bundle: false})];

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
            <SplitModePreview
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml
                plugins={plugins}
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

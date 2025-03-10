import {memo, useCallback} from 'react';

import {transform as quoteLink} from '@diplodoc/quote-link-extension';
import type {PluginWithParams} from 'markdown-it/lib';

import {QuoteLink as QuoteLinkExtension} from 'src/extensions/additional/QuoteLink';
import {
    MarkdownEditorView,
    type RenderPreview,
    mQuoteLinkItemData,
    markupToolbarConfigs,
    useMarkdownEditor,
    wQuoteLinkItemData,
    wysiwygToolbarConfigs,
} from 'src/index';
import {cloneDeep} from 'src/lodash';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {SplitModePreview} from '../../components/SplitModePreview';
import {plugins as defaultPlugins} from '../../defaults/md-plugins';
import {useLogs} from '../../hooks/useLogs';

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig.push([wQuoteLinkItemData]);

const wCommandMenuConfig = cloneDeep(wysiwygToolbarConfigs.wCommandMenuConfig);
wCommandMenuConfig.push(wQuoteLinkItemData);

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);
mToolbarConfig.push([mQuoteLinkItemData]);

const plugins: PluginWithParams[] = [...defaultPlugins, quoteLink({bundle: false})];

export const QuoteLink = memo(() => {
    const wSelectionMenuConfig = [
        [wQuoteLinkItemData],
        ...wysiwygToolbarConfigs.wSelectionMenuConfig,
    ];

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
                commandMenu: {
                    actions: wCommandMenuConfig,
                },
                selectionContext: {
                    config: wSelectionMenuConfig,
                },
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
                    markupToolbarConfig={mToolbarConfig}
                    wysiwygToolbarConfig={wToolbarConfig}
                />
            )}
        />
    );
});

QuoteLink.displayName = 'GPT';

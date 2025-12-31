import {memo, useState} from 'react';

import {
    MarkdownEditorView,
    gptExtension,
    mGptExtension,
    mGptToolbarItem,
    markupToolbarConfigs,
    useMarkdownEditor,
    wGptItemData,
    wysiwygToolbarConfigs,
} from '@gravity-ui/markdown-editor';
import {cloneDeep} from '@gravity-ui/markdown-editor/_/lodash.js';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {useLogs} from '../../hooks/useLogs';

import {initialMdContent} from './content';
import {gptWidgetProps} from './gptWidgetOptions';

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig.unshift([wGptItemData]);

const wCommandMenuConfig = cloneDeep(wysiwygToolbarConfigs.wCommandMenuConfig);
wCommandMenuConfig.unshift(wGptItemData);

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);
mToolbarConfig.unshift([mGptToolbarItem]);

export const GPT = memo(() => {
    const [showedAlertGpt, setShowedAlertGpt] = useState(true);

    const gptExtensionProps = gptWidgetProps({
        showedGptAlert: Boolean(showedAlertGpt),
        onCloseGptAlert: () => {
            setShowedAlertGpt(false);
        },
    });

    const markupExtension = mGptExtension(gptExtensionProps);
    const wSelectionMenuConfig = [[wGptItemData], ...wysiwygToolbarConfigs.wSelectionMenuConfig];

    const editor = useMarkdownEditor({
        initial: {markup: initialMdContent},
        markupConfig: {extensions: markupExtension},
        wysiwygConfig: {
            extensions: (builder) => builder.use(gptExtension, gptExtensionProps),
            extensionOptions: {
                commandMenu: {
                    actions: wCommandMenuConfig,
                },
                selectionContext: {
                    config: wSelectionMenuConfig,
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

GPT.displayName = 'GPT';

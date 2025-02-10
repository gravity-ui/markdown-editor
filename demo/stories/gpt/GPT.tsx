import {memo, useState} from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {
    MarkdownEditorView,
    gptExtension,
    logger,
    mGptExtension,
    mGptToolbarItem,
    markupToolbarConfigs,
    useMarkdownEditor,
    wGptItemData,
    wysiwygToolbarConfigs,
} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';

import {initialMdContent} from './content';
import {gptWidgetProps} from './gptWidgetOptions';

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

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

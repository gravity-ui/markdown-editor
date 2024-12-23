import React, {useState} from 'react';

import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';
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

export const GPT = React.memo(() => {
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
                    toaster={toaster}
                    className={className}
                    markupToolbarConfig={mToolbarConfig}
                    wysiwygToolbarConfig={wToolbarConfig}
                />
            )}
        />
    );
});

GPT.displayName = 'GPT';

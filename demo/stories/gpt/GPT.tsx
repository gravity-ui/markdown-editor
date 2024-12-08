import React, {useState} from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {
    gptExtension,
    logger,
    mGptExtension,
    mGptToolbarItem,
    markupToolbarConfigs,
    wGptItemData,
    wysiwygToolbarConfigs,
} from '../../../src';
import {Playground} from '../../components/Playground';

import {initialMdContent} from './content';
import {gptWidgetProps} from './gptWidgetOptions';

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig.unshift([wGptItemData]);
wToolbarConfig.push([
    wysiwygToolbarConfigs.wMermaidItemData,
    wysiwygToolbarConfigs.wYfmHtmlBlockItemData,
]);

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

const wCommandMenuConfig = wysiwygToolbarConfigs.wCommandMenuConfig.concat(
    wysiwygToolbarConfigs.wMathInlineItemData,
    wysiwygToolbarConfigs.wMathBlockItemData,
    wysiwygToolbarConfigs.wMermaidItemData,
    wysiwygToolbarConfigs.wYfmHtmlBlockItemData,
);

wCommandMenuConfig.unshift(wGptItemData);

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);

mToolbarConfig.push([
    markupToolbarConfigs.mMermaidButton,
    markupToolbarConfigs.mYfmHtmlBlockButton,
]);

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

    return (
        <Playground
            settingsVisible
            initial={initialMdContent}
            extraExtensions={(builder) => builder.use(gptExtension, gptExtensionProps)}
            wysiwygCommandMenuConfig={wCommandMenuConfig}
            extensionOptions={{selectionContext: {config: wSelectionMenuConfig}}}
            wysiwygToolbarConfig={wToolbarConfig}
            markupConfigExtensions={markupExtension}
            markupToolbarConfig={mToolbarConfig}
        />
    );
});

GPT.displayName = 'GPT';

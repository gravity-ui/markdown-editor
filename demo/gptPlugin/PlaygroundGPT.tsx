import React, {useState} from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {
    type MarkupString,
    gptExtension,
    logger,
    markupToolbarConfigs,
    wGptToolbarItem,
    wysiwygToolbarConfigs,
} from '../../src';
import {mGptExtension, mGptToolbarItem} from '../../src/extensions/yfm/GPT/MarkupGpt';
import {Playground} from '../Playground';

import {gptWidgetProps} from './gptWidgetOptions';
import {initialMdContent} from './md-content';

import '../Playground.scss';

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig.unshift([wGptToolbarItem]);

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

wCommandMenuConfig.unshift(wysiwygToolbarConfigs.wGptItemData);

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);

mToolbarConfig.push([
    markupToolbarConfigs.mMermaidButton,
    markupToolbarConfigs.mYfmHtmlBlockButton,
]);

mToolbarConfig.unshift([mGptToolbarItem]);

export const PlaygroundGPT = React.memo(() => {
    const [yfmRaw, setYfmRaw] = React.useState<MarkupString>(initialMdContent);

    const [showedAlertGpt, setShowedAlertGpt] = useState(true);

    const widgetProps = gptWidgetProps(setYfmRaw, {
        showedGptAlert: Boolean(showedAlertGpt),
        onCloseGptAlert: () => {
            setShowedAlertGpt(false);
        },
    });

    const markupExtension = [mGptExtension(widgetProps)];
    const wSelectionMenuConfig = [[wGptToolbarItem], ...wysiwygToolbarConfigs.wSelectionMenuConfig];

    return (
        <Playground
            settingsVisible
            initial={yfmRaw}
            extraExtensions={(builder) => builder.use(gptExtension, widgetProps)}
            wysiwygCommandMenuConfig={wCommandMenuConfig}
            extensionOptions={{selectionContext: {config: wSelectionMenuConfig}}}
            wysiwygToolbarConfig={wToolbarConfig}
            markupConfigExtensions={markupExtension}
            markupToolbarConfig={mToolbarConfig}
        />
    );
});

PlaygroundGPT.displayName = 'GPT';

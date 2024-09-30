import React, {useState} from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {
    type MarkupString,
    gptExtension,
    logger,
    wGptToolbarItem,
    wysiwygToolbarConfigs,
} from '../../src';
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

export const PlaygroundGPT = React.memo(() => {
    const [yfmRaw, setYfmRaw] = React.useState<MarkupString>(initialMdContent);

    const [showedAlertGpt, setShowedAlertGpt] = useState(true);

    const wSelectionMenuConfig = [[wGptToolbarItem], ...wysiwygToolbarConfigs.wSelectionMenuConfig];
    return (
        <Playground
            settingsVisible
            initial={yfmRaw}
            extraExtensions={(builder) =>
                builder.use(
                    gptExtension,
                    gptWidgetProps(setYfmRaw, {
                        showedGptAlert: Boolean(showedAlertGpt),
                        onCloseGptAlert: () => {
                            setShowedAlertGpt(false);
                        },
                    }),
                )
            }
            wysiwygCommandMenuConfig={wCommandMenuConfig}
            extensionOptions={{selectionContext: {config: wSelectionMenuConfig}}}
            wysiwygToolbarConfig={wToolbarConfig}
        />
    );
});

PlaygroundGPT.displayName = 'GPT';

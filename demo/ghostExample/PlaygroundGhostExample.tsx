import React from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {logger, markupToolbarConfigs} from '../../src';
import {Playground} from '../Playground';

import {ghostPopupExtension, ghostPopupToolbarItem} from './ghostExtension';
import {initialMdContent} from './md-content';

import '../Playground.scss';

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);

mToolbarConfig[2].unshift(ghostPopupToolbarItem);

export const PlaygroundGhostExample = React.memo(() => {
    return (
        <Playground
            settingsVisible
            markupToolbarConfig={mToolbarConfig}
            markupConfigExtensions={[ghostPopupExtension]}
            initial={initialMdContent}
        />
    );
});

PlaygroundGhostExample.displayName = 'Ghost-example';

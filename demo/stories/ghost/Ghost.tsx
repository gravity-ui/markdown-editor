import React from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {logger, markupToolbarConfigs} from '../../../src';
import {Playground} from '../../components/Playground';

import {initialMdContent} from './content';
import {ghostPopupExtension, ghostPopupToolbarItem} from './ghostExtension';

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);

mToolbarConfig[2].unshift(ghostPopupToolbarItem);

export const Ghost = () => {
    return (
        <Playground
            settingsVisible
            markupToolbarConfig={mToolbarConfig}
            markupConfigExtensions={[ghostPopupExtension]}
            initial={initialMdContent}
            initialEditor="markup"
        />
    );
};

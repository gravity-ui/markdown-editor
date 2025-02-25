import {generateID} from '@diplodoc/transform/lib/plugins/utils.js';
import type {Command} from 'prosemirror-state';

import {pType} from '../../base/BaseSchema';

import {
    TabAttrs,
    TabPanelAttrs,
    TabsAttrs,
    tabActiveClassname,
    tabPanelActiveClassname,
    tabPanelType,
    tabType,
    tabsListType,
    tabsType,
} from './const';

export const createYfmTabsCommand: Command = (state, dispatch) => {
    if (dispatch) {
        const {schema} = state;

        const tabId = generateID();
        const panelId = generateID();
        const yfmTabsList = tabsListType(schema);
        const yfmTabs = tabsType(schema);

        const yfmTabPanel = tabPanelType(state.schema).create(
            {
                [TabPanelAttrs.ariaLabelledby]: tabId,
                [TabPanelAttrs.id]: panelId,
                [TabPanelAttrs.class]: tabPanelActiveClassname,
            },
            pType(state.schema).createAndFill(),
        );
        const yfmTab = tabType(state.schema).create({
            [TabAttrs.id]: tabId,
            [TabAttrs.class]: tabActiveClassname,
            [TabAttrs.ariaControls]: panelId,
            [TabAttrs.dataDiplodocIsActive]: 'true',
            [TabAttrs.dataDiplodocid]: tabId,
            [TabAttrs.dataDiplodocKey]: tabId,
        });

        const tabs = yfmTabs.create({[TabsAttrs.dataDiplodocGroup]: generateID()}, [
            yfmTabsList.create(null, [yfmTab]),
            yfmTabPanel,
        ]);

        dispatch(state.tr.replaceSelectionWith(tabs).scrollIntoView());
    }

    return true;
};

export const createYfmTabs = {
    isEnable: createYfmTabsCommand,
    run: createYfmTabsCommand,
};

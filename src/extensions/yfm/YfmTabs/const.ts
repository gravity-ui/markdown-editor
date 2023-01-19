import {nodeTypeFactory} from '../../../utils/schema';

export enum TabsNode {
    Tab = 'yfm_tab',
    TabsList = 'yfm_tabs_list',
    TabPanel = 'yfm_tab_panel',
    Tabs = 'yfm_tabs',
}

export const tabActiveClassname = 'yfm-tab active';
export const tabInactiveClassname = 'yfm-tab';
export const tabPanelActiveClassname = 'yfm-tab-panel active';
export const tabPanelInactiveClassname = 'yfm-tab-panel';

export const tabPanelType = nodeTypeFactory(TabsNode.TabPanel);
export const tabType = nodeTypeFactory(TabsNode.Tab);
export const tabsType = nodeTypeFactory(TabsNode.Tabs);
export const tabListType = nodeTypeFactory(TabsNode.TabsList);

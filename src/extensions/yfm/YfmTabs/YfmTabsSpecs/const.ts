export enum TabsNode {
    // tabs panel is common for tabs and radio tabs
    TabPanel = 'yfm_tab_panel',

    Tab = 'yfm_tab',
    TabsList = 'yfm_tabs_list',
    Tabs = 'yfm_tabs',

    RadioTabs = 'yfm_radio_tabs',
    RadioTab = 'yfm_radio_tab',
    RadioTabInput = 'yfm_radio_tab_input',
    RadioTabLabel = 'yfm_radio_tab_label',
}

export enum TabsAttrs {
    class = 'class',
    dataDiplodocGroup = 'data-diplodoc-group',
}

export enum TabsListAttrs {
    class = 'class',
    role = 'role',
}

export enum TabAttrs {
    id = 'id',
    class = 'class',
    role = 'role',
    ariaControls = 'aria-controls',
    ariaSelected = 'aria-selected',
    tabindex = 'tabindex',
    dataDiplodocKey = 'data-diplodoc-key',
    dataDiplodocid = 'data-diplodoc-id',
    dataDiplodocIsActive = 'data-diplodoc-is-active',
    dataDiplodocVerticalTab = 'data-diplodoc-vertical-tab',
}

export enum TabPanelAttrs {
    id = 'id',
    class = 'class',
    role = 'role',
    dataTitle = 'data-title',
    ariaLabelledby = 'aria-labelledby',
}

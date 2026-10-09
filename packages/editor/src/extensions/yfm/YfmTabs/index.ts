import '@diplodoc/tabs-extension/runtime';
import {chainCommands} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '#core';

import {TabsNode, YfmTabsSpecs} from './YfmTabsSpecs';
import {createYfmTabs} from './actions';
import {
    dragAutoSwitch,
    joinBackwardToOpenTab,
    liftEmptyBlockFromTabPanel,
    removeTabWhenCursorAtTheStartOfTab,
    tabEnter,
    tabPanelArrowDown,
} from './plugins';
import {tabPanelView, tabView, vtabInputView, vtabView} from './views';

import '@diplodoc/tabs-extension/runtime/styles.css';

export {TabsNode, tabType, tabsType, tabsListType, tabPanelType} from './YfmTabsSpecs';

const actionName = 'toYfmTabs';

export const YfmTabs: ExtensionAuto = (builder) => {
    builder
        .use(YfmTabsSpecs, {})
        .addNodeView(TabsNode.Tab, () => tabView)
        .addNodeView(TabsNode.TabPanel, () => tabPanelView)
        .addNodeView(TabsNode.RadioTab, () => vtabView)
        .addNodeView(TabsNode.RadioTabInput, () => vtabInputView);

    builder.addKeymap(
        () => ({
            Backspace: chainCommands(removeTabWhenCursorAtTheStartOfTab, joinBackwardToOpenTab),
            ArrowDown: tabPanelArrowDown,
            Enter: chainCommands(tabEnter, liftEmptyBlockFromTabPanel),
            'Shift-Enter': tabEnter,
        }),
        builder.Priority.High,
    );

    builder.addAction(actionName, () => createYfmTabs);

    builder.addPlugin(dragAutoSwitch);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [actionName]: Action;
        }
    }
}

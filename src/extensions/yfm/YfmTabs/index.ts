import {chainCommands} from 'prosemirror-commands';

import type {Action, ExtensionAuto} from '../../../core';

import {YfmTabsSpecs} from './YfmTabsSpecs';
import {createYfmTabs} from './actions';
import {
    dragAutoSwitch,
    joinBackwardToOpenTab,
    liftEmptyBlockFromTabPanel,
    removeTabWhenCursorAtTheStartOfTab,
    tabEnter,
    tabPanelArrowDown,
} from './plugins';
import {tabPanelView, tabView} from './views';

export {TabsNode, tabType, tabsType, tabsListType, tabPanelType} from './YfmTabsSpecs';

const actionName = 'toYfmTabs';

export const YfmTabs: ExtensionAuto = (builder) => {
    builder.use(YfmTabsSpecs, {
        tabView: () => tabView,
        tabPanelView: () => tabPanelView,
    });

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
    namespace YfmEditor {
        interface Actions {
            [actionName]: Action;
        }
    }
}

import type {Action, ExtensionAuto} from '../../../core';

import {
    joinBackwardToOpenTab,
    removeTabWhenCursorAtTheStartOfTab,
    tabEnter,
    tabPanelArrowDown,
} from './plugins';
import {YfmTabsSpecs} from './YfmTabsSpecs';

import {chainCommands} from 'prosemirror-commands';

import {tabPanelView, tabView} from './views';
import {createYfmTabs} from './actions';

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
            Enter: tabEnter,
            'Shift-Enter': tabEnter,
        }),
        builder.Priority.High,
    );

    builder.addAction(actionName, () => createYfmTabs);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [actionName]: Action;
        }
    }
}

import log from '@doc-tools/transform/lib/log';
import yfmPlugin from '@doc-tools/transform/lib/plugins/tabs';
import {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, YENodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';
import {TabsNode} from './const';
import {fromYfm} from './fromYfm';
import {getSpec} from './spec';
import {toYfm} from './toYfm';

export {TabsNode} from './const';
export const tabPanelType = nodeTypeFactory(TabsNode.TabPanel);
export const tabType = nodeTypeFactory(TabsNode.Tab);
export const tabsType = nodeTypeFactory(TabsNode.Tabs);
export const tabsListType = nodeTypeFactory(TabsNode.TabsList);

export type YfmTabsSpecsOptions = {
    tabPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    tabView?: YENodeSpec['view'];
    tabsListView?: YENodeSpec['view'];
    tabPanelView?: YENodeSpec['view'];
    tabsView?: YENodeSpec['view'];
};

export const YfmTabsSpecs: ExtensionAuto<YfmTabsSpecsOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(TabsNode.Tab, () => ({
            spec: spec[TabsNode.Tab],
            toYfm: toYfm[TabsNode.Tab],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.Tab],
                tokenName: 'tab',
            },
            view: opts.tabView,
        }))
        .addNode(TabsNode.TabsList, () => ({
            spec: spec[TabsNode.TabsList],
            toYfm: toYfm[TabsNode.TabsList],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.TabsList],
                tokenName: 'tab-list',
            },
            view: opts.tabsListView,
        }))
        .addNode(TabsNode.TabPanel, () => ({
            spec: spec[TabsNode.TabPanel],
            toYfm: toYfm[TabsNode.TabPanel],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.TabPanel],
                tokenName: 'tab-panel',
            },
            view: opts.tabPanelView,
        }))
        .addNode(TabsNode.Tabs, () => ({
            spec: spec[TabsNode.Tabs],
            toYfm: toYfm[TabsNode.Tabs],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.Tabs],
                tokenName: 'tabs',
            },
            view: opts.tabsView,
        }));
};

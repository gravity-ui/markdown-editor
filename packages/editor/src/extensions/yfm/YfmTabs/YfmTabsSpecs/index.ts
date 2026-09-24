import type {ExtensionAuto, NodeViewFactory} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {TabsNode} from './const';
import {YfmTabsParserSpecs} from './parser';
import {type YfmTabsSchemaOptions, YfmTabsSchemaSpecs} from './schema';
import {YfmTabsSerializerSpecs} from './serializer';

export {TabsNode} from './const';
export const tabPanelType = nodeTypeFactory(TabsNode.TabPanel);
export const tabType = nodeTypeFactory(TabsNode.Tab);
export const tabsType = nodeTypeFactory(TabsNode.Tabs);
export const tabsListType = nodeTypeFactory(TabsNode.TabsList);

export type YfmTabsSpecsOptions = YfmTabsSchemaOptions & {
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    tabView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    tabsListView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    tabPanelView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    tabsView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    vtabView?: NodeViewFactory;
    /** @deprecated Register the view with builder.addNodeView() after the specs. */
    vtabInputView?: NodeViewFactory;
};

export const YfmTabsSpecs: ExtensionAuto<YfmTabsSpecsOptions> = (builder, opts) => {
    builder.use(YfmTabsSchemaSpecs, opts).use(YfmTabsParserSpecs).use(YfmTabsSerializerSpecs);

    if (opts.tabView) {
        builder.addNodeView(TabsNode.Tab, opts.tabView);
    }

    if (opts.tabsListView) {
        builder.addNodeView(TabsNode.TabsList, opts.tabsListView);
    }

    if (opts.tabPanelView) {
        builder.addNodeView(TabsNode.TabPanel, opts.tabPanelView);
    }

    if (opts.tabsView) {
        builder.addNodeView(TabsNode.Tabs, opts.tabsView);
    }

    if (opts.vtabView) {
        builder.addNodeView(TabsNode.RadioTab, opts.vtabView);
    }

    if (opts.vtabInputView) {
        builder.addNodeView(TabsNode.RadioTabInput, opts.vtabInputView);
    }
};

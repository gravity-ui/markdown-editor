import log from '@diplodoc/transform/lib/log';
import yfmPlugin from '@diplodoc/transform/lib/plugins/tabs';
import {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {TabsNode} from './const';
import {parserTokens} from './parser';
import {getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {TabsNode} from './const';
export const tabPanelType = nodeTypeFactory(TabsNode.TabPanel);
export const tabType = nodeTypeFactory(TabsNode.Tab);
export const tabsType = nodeTypeFactory(TabsNode.Tabs);
export const tabsListType = nodeTypeFactory(TabsNode.TabsList);

export type YfmTabsSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    tabPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
    tabView?: ExtensionNodeSpec['view'];
    tabsListView?: ExtensionNodeSpec['view'];
    tabPanelView?: ExtensionNodeSpec['view'];
    tabsView?: ExtensionNodeSpec['view'];
};

export const YfmTabsSpecs: ExtensionAuto<YfmTabsSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts);

    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(TabsNode.Tab, () => ({
            spec: schemaSpecs[TabsNode.Tab],
            toMd: serializerTokens[TabsNode.Tab],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.Tab],
                tokenName: 'tab',
            },
            view: opts.tabView,
        }))
        .addNode(TabsNode.TabsList, () => ({
            spec: schemaSpecs[TabsNode.TabsList],
            toMd: serializerTokens[TabsNode.TabsList],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.TabsList],
                tokenName: 'tab-list',
            },
            view: opts.tabsListView,
        }))
        .addNode(TabsNode.TabPanel, () => ({
            spec: schemaSpecs[TabsNode.TabPanel],
            toMd: serializerTokens[TabsNode.TabPanel],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.TabPanel],
                tokenName: 'tab-panel',
            },
            view: opts.tabPanelView,
        }))
        .addNode(TabsNode.Tabs, () => ({
            spec: schemaSpecs[TabsNode.Tabs],
            toMd: serializerTokens[TabsNode.Tabs],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.Tabs],
                tokenName: 'tabs',
            },
            view: opts.tabsView,
        }));
};

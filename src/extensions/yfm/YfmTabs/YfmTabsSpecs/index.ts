import {transform as yfmTabs} from '@diplodoc/tabs-extension';

import type {ExtensionAuto, ExtensionNodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {TabsNode} from './const';
import {tabsPostPlugin} from './md-plugin';
import {parserTokens} from './parser';
import {type YfmTabsSchemaOptions, getSchemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {TabsNode} from './const';
export const tabPanelType = nodeTypeFactory(TabsNode.TabPanel);
export const tabType = nodeTypeFactory(TabsNode.Tab);
export const tabsType = nodeTypeFactory(TabsNode.Tabs);
export const tabsListType = nodeTypeFactory(TabsNode.TabsList);

export type YfmTabsSpecsOptions = YfmTabsSchemaOptions & {
    tabView?: ExtensionNodeSpec['view'];
    tabsListView?: ExtensionNodeSpec['view'];
    tabPanelView?: ExtensionNodeSpec['view'];
    tabsView?: ExtensionNodeSpec['view'];
    vtabView?: ExtensionNodeSpec['view'];
    vtabInputView?: ExtensionNodeSpec['view'];
};

export const YfmTabsSpecs: ExtensionAuto<YfmTabsSpecsOptions> = (builder, opts) => {
    const schemaSpecs = getSchemaSpecs(opts);

    builder
        .configureMd((md) =>
            md
                .use(
                    yfmTabs({
                        bundle: false,
                        features: {
                            enabledVariants: {
                                regular: true,
                                radio: true,
                                dropdown: false,
                                accordion: false,
                            },
                        },
                    }),
                )
                .use(tabsPostPlugin),
        )
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

    builder
        .addNode(TabsNode.RadioTabs, () => ({
            spec: schemaSpecs[TabsNode.RadioTabs],
            toMd: serializerTokens[TabsNode.RadioTabs],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.RadioTabs],
                tokenName: 'r-tabs',
            },
        }))
        .addNode(TabsNode.RadioTab, () => ({
            spec: schemaSpecs[TabsNode.RadioTab],
            toMd: serializerTokens[TabsNode.RadioTab],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.RadioTab],
                tokenName: 'r-tab',
            },
            view: opts.vtabView,
        }))
        .addNode(TabsNode.RadioTabInput, () => ({
            spec: schemaSpecs[TabsNode.RadioTabInput],
            toMd: serializerTokens[TabsNode.RadioTabInput],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.RadioTabInput],
                tokenName: 'r-tab-input',
            },
            view: opts.vtabInputView,
        }))
        .addNode(TabsNode.RadioTabLabel, () => ({
            spec: schemaSpecs[TabsNode.RadioTabLabel],
            toMd: serializerTokens[TabsNode.RadioTabLabel],
            fromMd: {
                tokenSpec: parserTokens[TabsNode.RadioTabLabel],
                tokenName: 'r-tab-label',
            },
        }));
};

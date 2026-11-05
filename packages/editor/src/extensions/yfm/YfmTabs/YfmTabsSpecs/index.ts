import type {ExtensionAuto} from '#core';
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

export type YfmTabsSpecsOptions = YfmTabsSchemaOptions & {};

export const YfmTabsSpecs: ExtensionAuto<YfmTabsSpecsOptions> = (builder, opts) => {
    builder.use(YfmTabsSchemaSpecs, opts).use(YfmTabsParserSpecs).use(YfmTabsSerializerSpecs);
};

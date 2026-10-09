import {transform as yfmTabs} from '@diplodoc/tabs-extension';
import type Token from 'markdown-it/lib/token';

import type {ExtensionAuto, ParserToken} from '#core';

import {TabsNode} from './const';
import {tabsPostPlugin} from './md-plugin';

const attrsFromEntries = (token: Token) => (token.attrs ? Object.fromEntries(token.attrs) : {});

const parserTokens: Record<TabsNode, ParserToken> = {
    [TabsNode.TabPanel]: {
        name: TabsNode.TabPanel,
        type: 'block',
        getAttrs: attrsFromEntries,
    },

    [TabsNode.Tab]: {
        name: TabsNode.Tab,
        type: 'block',
        getAttrs: attrsFromEntries,
    },
    [TabsNode.Tabs]: {
        name: TabsNode.Tabs,
        type: 'block',
        getAttrs: attrsFromEntries,
    },
    [TabsNode.TabsList]: {
        name: TabsNode.TabsList,
        type: 'block',
        getAttrs: attrsFromEntries,
    },

    [TabsNode.RadioTabs]: {
        name: TabsNode.RadioTabs,
        type: 'block',
        getAttrs: attrsFromEntries,
    },
    [TabsNode.RadioTab]: {
        name: TabsNode.RadioTab,
        type: 'block',
        getAttrs: attrsFromEntries,
    },
    [TabsNode.RadioTabInput]: {
        name: TabsNode.RadioTabInput,
        type: 'node',
        getAttrs: attrsFromEntries,
    },
    [TabsNode.RadioTabLabel]: {
        name: TabsNode.RadioTabLabel,
        type: 'block',
        getAttrs: attrsFromEntries,
    },
};

export const YfmTabsParserSpecs: ExtensionAuto = (builder) => {
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
        .addMarkdownTokenParserSpec('tab', () => parserTokens[TabsNode.Tab])
        .addMarkdownTokenParserSpec('tab-list', () => parserTokens[TabsNode.TabsList])
        .addMarkdownTokenParserSpec('tab-panel', () => parserTokens[TabsNode.TabPanel])
        .addMarkdownTokenParserSpec('tabs', () => parserTokens[TabsNode.Tabs])
        .addMarkdownTokenParserSpec('r-tabs', () => parserTokens[TabsNode.RadioTabs])
        .addMarkdownTokenParserSpec('r-tab', () => parserTokens[TabsNode.RadioTab])
        .addMarkdownTokenParserSpec('r-tab-input', () => parserTokens[TabsNode.RadioTabInput])
        .addMarkdownTokenParserSpec('r-tab-label', () => parserTokens[TabsNode.RadioTabLabel]);
};

import type Token from 'markdown-it/lib/token';

import type {ParserToken} from '../../../../core';

import {TabsNode} from './const';

const attrsFromEntries = (token: Token) => (token.attrs ? Object.fromEntries(token.attrs) : {});

export const parserTokens: Record<TabsNode, ParserToken> = {
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

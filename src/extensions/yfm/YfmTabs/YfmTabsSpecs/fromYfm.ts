import type Token from 'markdown-it/lib/token';

import type {ParserToken} from '../../../../core';

import {TabsNode} from './const';

const attrsFromEntries = (token: Token) => (token.attrs ? Object.fromEntries(token.attrs) : {});

export const fromYfm: Record<TabsNode, ParserToken> = {
    [TabsNode.Tab]: {
        name: TabsNode.Tab,
        type: 'block',
        getAttrs: attrsFromEntries,
    },

    [TabsNode.TabPanel]: {
        name: TabsNode.TabPanel,
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
};

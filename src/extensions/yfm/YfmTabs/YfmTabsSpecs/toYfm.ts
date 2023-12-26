import type {Node} from 'prosemirror-model';

import type {SerializerNodeToken} from '../../../../core';
import {getPlaceholderContent} from '../../../../utils/placeholder';

import {TabsNode} from './const';

export const toYfm: Record<TabsNode, SerializerNodeToken> = {
    [TabsNode.Tab]: (state, node) => {
        state.renderInline(node);
    },

    [TabsNode.TabPanel]: (state, node) => {
        state.renderContent(node);
    },

    [TabsNode.Tabs]: (state, node) => {
        state.write('{% list tabs %}\n\n');
        const children: Node[] = [];
        node.content.forEach((a) => {
            children.push(a);
        });

        const tabList = children[0].content;

        tabList.forEach((tab, _, i) => {
            state.write('- ' + (tab.textContent || getPlaceholderContent(tab)) + '\n\n');
            if (children[i + 1]) state.renderList(children[i + 1], '  ', () => '  ');
        });

        state.write('{% endlist %}');
        state.closeBlock(node);
    },
    [TabsNode.TabsList]: (state, node) => {
        state.renderList(node, '  ', () => (node.attrs.bullet || '-') + ' ');
    },
};

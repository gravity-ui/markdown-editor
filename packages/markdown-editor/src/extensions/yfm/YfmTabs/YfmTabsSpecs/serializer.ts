import type {Node} from 'prosemirror-model';

import type {SerializerNodeToken} from '../../../../core';
import {getChildrenOfNode} from '../../../../utils/nodes';
import {getPlaceholderContent} from '../../../../utils/placeholder';

import {TabsNode} from './const';

export const serializerTokens: Record<TabsNode, SerializerNodeToken> = {
    [TabsNode.Tab]: (state, node) => {
        state.renderInline(node);
    },

    [TabsNode.TabPanel]: (state, node) => {
        state.renderContent(node);
    },

    [TabsNode.Tabs]: (state, node) => {
        state.write('{% list tabs %}');
        state.write('\n');
        state.write('\n');

        const children: Node[] = [];
        node.content.forEach((a) => {
            children.push(a);
        });

        const tabList = children[0].content;

        tabList.forEach((tab, _, i) => {
            state.write('- ' + (tab.textContent || getPlaceholderContent(tab)));
            state.write('\n');
            state.write('\n');

            if (children[i + 1]) state.renderList(children[i + 1], '  ', () => '  ');
        });

        state.write('{% endlist %}');
        state.closeBlock(node);
    },

    [TabsNode.TabsList]: (state, node) => {
        state.renderList(node, '  ', () => (node.attrs.bullet || '-') + ' ');
    },

    [TabsNode.RadioTabs]: (state, node) => {
        state.write('{% list tabs radio %}');
        state.write('\n');
        state.write('\n');

        const children = getChildrenOfNode(node);
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.node.type.name !== TabsNode.RadioTab) continue;

            state.write(
                '- ' + (child.node.textContent || getPlaceholderContent(child.node.lastChild!)),
            );
            state.write('\n');
            state.write('\n');

            const nextChild = children[i + 1];
            if (nextChild.node.type.name !== TabsNode.TabPanel) continue;

            state.renderList(nextChild.node, '  ', () => '  ');
        }

        state.write('{% endlist %}');
        state.closeBlock(node);
    },

    [TabsNode.RadioTab]: (state, node) => {
        state.renderInline(node);
    },

    [TabsNode.RadioTabInput]: () => {},

    [TabsNode.RadioTabLabel]: (state, node) => {
        state.renderInline(node);
    },
};

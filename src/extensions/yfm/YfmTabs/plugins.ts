import {Command, TextSelection} from 'prosemirror-state';
import {findChildren, findParentNodeOfType} from 'prosemirror-utils';
import {
    tabActiveClassname,
    tabInactiveClassname,
    tabListType,
    tabPanelActiveClassname,
    tabPanelInactiveClassname,
    tabPanelType,
    tabsType,
    tabType,
} from './const';
import {findChildIndex} from '../../../table-utils/helpers';
import {get$Cursor} from '../../../utils/selection';

export const tabPanelBackspace: Command = (state) => {
    const $cursor = get$Cursor(state.selection);
    if (
        $cursor?.node($cursor.depth - 1).type === tabPanelType(state.schema) &&
        $cursor.start($cursor.depth - 1) === $cursor.pos - 1
    ) {
        return true;
    }
    return false;
};

export const tabBackspace: Command = (state, dispatch) => {
    const tabToRemove = findParentNodeOfType(tabType(state.schema))(state.selection);
    const tabsParentNode = findParentNodeOfType(tabsType(state.schema))(state.selection);

    if (
        tabsParentNode &&
        tabToRemove &&
        state.selection.from === tabToRemove.pos + 1 &&
        state.selection.from === state.selection.to
    ) {
        const tabList = findChildren(tabsParentNode.node, (tabNode) => {
            return tabNode.type.name === tabListType(state.schema).name;
        })[0];
        const tabToRemoveIdx = findChildIndex(tabList.node, tabToRemove.node);

        const tabNodes = findChildren(
            tabList.node,
            (node) => node.type.name === tabType(state.schema).name,
        );

        const tabPanels = findChildren(tabsParentNode.node, (tabNode) => {
            return tabNode.type.name === tabPanelType(state.schema).name;
        });

        const panelToRemove = tabPanels.filter(
            (tabNode) => tabNode.node.attrs['aria-labelledby'] === tabToRemove.node.attrs['id'],
        )[0];

        if (panelToRemove && dispatch) {
            // Change relative pos to absolute
            panelToRemove.pos = panelToRemove.pos + tabsParentNode.pos;
            const {tr} = state;

            if (tabNodes.length <= 1) {
                tr.delete(tabsParentNode.pos, tabsParentNode.pos + tabsParentNode.node.nodeSize);
            } else {
                const newTabIdx = tabToRemoveIdx - 1 < 0 ? 1 : tabToRemoveIdx - 1;

                // Change relative pos to absolute
                tabNodes.forEach((v) => {
                    v.pos = v.pos + tabsParentNode.pos + 2;
                });

                const newTabNode = tabNodes[newTabIdx];

                const newTabPanelNode = tabPanels[newTabIdx];
                // Change relative pos to absolute
                newTabPanelNode.pos = newTabPanelNode.pos + tabsParentNode.pos + 1;

                // Find all active tabs and make them inactive
                const activeTabs = tabNodes.filter(
                    (v) => v.node.attrs['class'] === tabActiveClassname,
                );

                if (activeTabs.length) {
                    activeTabs.forEach((tab) => {
                        tr.setNodeMarkup(tab.pos, null, {
                            ...tab.node.attrs,
                            class: tabInactiveClassname,
                        });
                    });
                }

                // Find all active panels and make them inactive
                const activePanels = tabPanels.filter(
                    (v) => v.node.attrs['class'] === tabPanelActiveClassname,
                );
                if (activePanels.length) {
                    activePanels.forEach((tabPanel) => {
                        tr.setNodeMarkup(
                            tr.mapping.map(tabPanel.pos + tabsParentNode.pos + 1),
                            null,
                            {
                                ...tabPanel.node.attrs,
                                class: tabPanelInactiveClassname,
                            },
                        );
                    });
                }

                tr
                    // Delete panel
                    .delete(panelToRemove.pos, panelToRemove.pos + panelToRemove.node.nodeSize)
                    // Delete tab
                    .delete(tabToRemove.pos, tabToRemove.pos + tabToRemove.node.nodeSize)
                    // Set new active tab
                    .setNodeMarkup(tr.mapping.map(newTabNode.pos), null, {
                        ...newTabNode.node.attrs,
                        class: tabActiveClassname,
                    })
                    // Set new active panel
                    .setNodeMarkup(tr.mapping.map(newTabPanelNode.pos), null, {
                        ...newTabPanelNode.node.attrs,
                        class: tabPanelActiveClassname,
                    })
                    .setSelection(
                        TextSelection.create(
                            tr.doc,
                            tr.mapping.map(newTabNode.pos + newTabNode.node.nodeSize - 1),
                        ),
                    );
            }
            dispatch(tr);

            return true;
        }
    }

    return false;
};

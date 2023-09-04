import {Command, TextSelection, Transaction} from 'prosemirror-state';
import {
    findChildren,
    findParentNodeOfType,
    findParentNodeOfTypeClosestToPos,
    NodeWithPos,
} from 'prosemirror-utils';
import {
    tabActiveClassname,
    tabInactiveClassname,
    tabsListType,
    tabPanelActiveClassname,
    tabPanelInactiveClassname,
    tabPanelType,
    tabsType,
    tabType,
} from './const';
import {findChildIndex} from '../../../table-utils/helpers';
import {get$Cursor, isTextSelection} from '../../../utils/selection';
import {generateID} from '@doc-tools/transform/lib/plugins/utils';
import {
    createFakeParagraph,
    findFakeParaPosClosestToPos,
    findFakeParaPosForTextSelection,
    isGapCursorSelection,
    pType,
} from '../../';
import {atEndOfPanel} from './utils';
import {TabAttrs, TabPanelAttrs} from './YfmTabsSpecs/const';

export const tabPanelArrowDown: Command = (state, dispatch, view) => {
    const {selection: sel} = state;
    const tabsParentNode = findParentNodeOfType(tabsType(state.schema))(state.selection);

    if (atEndOfPanel(view) && view?.endOfTextblock('down')) {
        const [direction, $cursor] = ['after', sel.$to] as const;
        let $pos;
        if (isTextSelection(sel)) {
            $pos =
                findFakeParaPosForTextSelection(sel, direction) ??
                findFakeParaPosClosestToPos($cursor, $cursor.depth - 2, direction);
        }
        if (isGapCursorSelection(sel) && tabsParentNode) {
            $pos = state.doc.resolve(tabsParentNode.pos + tabsParentNode.node.nodeSize);
        }
        if ($pos) {
            dispatch?.(createFakeParagraph(state.tr, $pos, direction).scrollIntoView());
            return true;
        }
    }

    return false;
};

export const tabEnter: Command = (state) => {
    const $cursor = get$Cursor(state.selection);
    return $cursor?.node($cursor.depth).type === tabType(state.schema);
};

const makeTabsInactive = (tabNodes: NodeWithPos[], tabPanels: NodeWithPos[], tr: Transaction) => {
    // Find all active tabs and make them inactive
    const activeTabs = tabNodes.filter(
        (v) => v.node.attrs[TabAttrs.dataDiplodocIsActive] === 'true',
    );

    if (activeTabs.length) {
        activeTabs.forEach((tab) => {
            tr.setNodeMarkup(tab.pos, null, {
                ...tab.node.attrs,
                class: tabInactiveClassname,
                [TabAttrs.dataDiplodocIsActive]: 'false',
            });
        });
    }

    // Find all active panels and make them inactive
    const activePanels = tabPanels.filter(
        (v) => v.node.attrs[TabPanelAttrs.class] === tabPanelActiveClassname,
    );
    if (activePanels.length) {
        activePanels.forEach((tabPanel) => {
            tr.setNodeMarkup(tr.mapping.map(tabPanel.pos), null, {
                ...tabPanel.node.attrs,
                class: tabPanelInactiveClassname,
            });
        });
    }
};

export const createTab: (afterTab: NodeWithPos, tabsParentNode: NodeWithPos) => Command =
    (afterTab, tabsParentNode) => (state, dispatch, view) => {
        const tabNodes = findChildren(
            tabsParentNode.node,
            (node) => node.type.name === tabType(state.schema).name,
        );

        const tabPanels = findChildren(tabsParentNode.node, (tabNode) => {
            return tabNode.type.name === tabPanelType(state.schema).name;
        });

        const afterPanelNode = tabPanels.filter(
            (tabPanelNode) =>
                tabPanelNode.node.attrs[TabPanelAttrs.ariaLabelledby] ===
                afterTab.node.attrs[TabAttrs.dataDiplodocid],
        )[0];

        const tabId = generateID();
        const panelId = generateID();

        const newPanel = tabPanelType(state.schema).create(
            {
                [TabPanelAttrs.ariaLabelledby]: tabId,
                [TabPanelAttrs.id]: panelId,
                [TabPanelAttrs.class]: tabPanelActiveClassname,
            },
            pType(state.schema).createAndFill(),
        );
        const newTab = tabType(state.schema).create({
            [TabAttrs.id]: tabId,
            [TabAttrs.dataDiplodocid]: tabId,
            [TabAttrs.dataDiplodocKey]: tabId,
            [TabAttrs.dataDiplodocIsActive]: 'true',
            [TabAttrs.class]: tabActiveClassname,
            [TabAttrs.role]: 'tab',
            [TabAttrs.ariaControls]: panelId,
        });

        const {tr} = state;

        // Change relative pos to absolute
        tabNodes.forEach((v) => {
            v.pos = v.pos + tabsParentNode.pos + 1;
        });

        tabPanels.forEach((v) => {
            v.pos = v.pos + tabsParentNode.pos + 1;
        });

        makeTabsInactive(tabNodes, tabPanels, tr);

        dispatch?.(
            tr
                .insert(afterPanelNode.pos + afterPanelNode.node.nodeSize, newPanel)
                .insert(afterTab.pos + afterTab.node.nodeSize, newTab)
                .setSelection(
                    TextSelection.create(tr.doc, afterTab.pos + afterTab.node.nodeSize + 1),
                ),
        );

        view?.focus();

        return true;
    };

export const removeTab: (tabToRemove: NodeWithPos, tabsParentNode: NodeWithPos) => Command =
    (tabToRemove, tabsParentNode) => (state, dispatch, view) => {
        const tabList = findChildren(tabsParentNode.node, (tabNode) => {
            return tabNode.type.name === tabsListType(state.schema).name;
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
            (tabPanelNode) =>
                tabPanelNode.node.attrs[TabPanelAttrs.ariaLabelledby] ===
                tabToRemove.node.attrs[TabAttrs.dataDiplodocid],
        )[0];

        if (panelToRemove && dispatch) {
            const {tr} = state;

            if (tabNodes.length <= 1) {
                tr.delete(tabsParentNode.pos, tabsParentNode.pos + tabsParentNode.node.nodeSize);
            } else {
                const newTabIdx = tabToRemoveIdx - 1 < 0 ? 1 : tabToRemoveIdx - 1;

                // Change relative pos to absolute
                tabNodes.forEach((v) => {
                    v.pos = v.pos + tabsParentNode.pos + 2;
                });

                tabPanels.forEach((v) => {
                    v.pos = v.pos + tabsParentNode.pos + 1;
                });

                const newTabNode = tabNodes[newTabIdx];

                const newTabPanelNode = tabPanels[newTabIdx];

                makeTabsInactive(tabNodes, tabPanels, tr);

                tr
                    // Delete panel
                    .delete(panelToRemove.pos, panelToRemove.pos + panelToRemove.node.nodeSize)
                    // Delete tab
                    .delete(tabToRemove.pos, tabToRemove.pos + tabToRemove.node.nodeSize)
                    // Set new active tab
                    .setNodeMarkup(tr.mapping.map(newTabNode.pos), null, {
                        ...newTabNode.node.attrs,
                        class: tabActiveClassname,
                        [TabAttrs.dataDiplodocIsActive]: 'true',
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
            view?.focus();

            return true;
        }

        return false;
    };

export const removeTabWhenCursorAtTheStartOfTab: Command = (state, dispatch) => {
    const tabToRemove = findParentNodeOfType(tabType(state.schema))(state.selection);
    const tabsParentNode = findParentNodeOfType(tabsType(state.schema))(state.selection);

    if (
        tabsParentNode &&
        tabToRemove &&
        state.selection.from === tabToRemove.pos + 1 &&
        state.selection.from === state.selection.to
    ) {
        return removeTab(tabToRemove, tabsParentNode)(state, dispatch);
    }

    return false;
};

export const joinBackwardToOpenTab: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor || $cursor.parentOffset !== 0) return false;
    // --> cursor at start of textblock
    const textBlockIndex = $cursor.index($cursor.depth - 1);
    if (textBlockIndex <= 0) return false;
    const nodeBefore = $cursor.node($cursor.depth - 1).child(textBlockIndex - 1);

    if (nodeBefore.type !== tabsType(state.schema)) {
        return false;
    }

    const tabsParent = findParentNodeOfTypeClosestToPos(
        state.doc.resolve($cursor.pos - 2),
        tabsType(state.schema),
    );

    if (!tabsParent) {
        return false;
    }
    const activePanel = findChildren(
        tabsParent.node,
        (n) => n.attrs.class === tabPanelActiveClassname,
    )[0];

    if (dispatch) {
        const posEndOfLastLayoutCell = activePanel.pos + tabsParent.pos + activePanel.node.nodeSize;
        const tr = state.tr;
        tr.delete($cursor.before(), $cursor.after());
        tr.insert(posEndOfLastLayoutCell, $cursor.parent);
        tr.setSelection(TextSelection.create(tr.doc, posEndOfLastLayoutCell + 1));
        dispatch(tr.scrollIntoView());
    }

    return true;
};

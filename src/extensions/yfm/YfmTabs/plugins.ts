import {generateID} from '@diplodoc/transform/lib/plugins/utils';
import {Command, Plugin, PluginView, TextSelection, Transaction} from 'prosemirror-state';
import type {Transform} from 'prosemirror-transform';
import {
    NodeWithPos,
    findChildren,
    findDomRefAtPos,
    findParentNodeOfType,
    findParentNodeOfTypeClosestToPos,
} from 'prosemirror-utils';
import type {EditorView} from 'prosemirror-view';

import {
    createFakeParagraph,
    findFakeParaPosClosestToPos,
    findFakeParaPosForTextSelection,
    isGapCursorSelection,
    pType,
} from '../../';
import {throttle} from '../../../lodash';
import {findChildIndex} from '../../../table-utils/helpers';
import {isSameNodeType} from '../../../utils';
import {get$Cursor, isTextSelection} from '../../../utils/selection';

import {TabAttrs, TabPanelAttrs} from './YfmTabsSpecs/const';
import {
    tabActiveClassname,
    tabInactiveClassname,
    tabPanelActiveClassname,
    tabPanelInactiveClassname,
    tabPanelType,
    tabType,
    tabsListType,
    tabsType,
} from './const';
import {atEndOfPanel} from './utils';

export const dragAutoSwitch = () =>
    new Plugin({
        view: TabsAutoSwitchOnDragOver.view,
    });

class TabsAutoSwitchOnDragOver implements PluginView {
    private static readonly TAB_SELECTOR = '.yfm-tab:not([data-diplodoc-is-active=true])';
    private static readonly OPEN_TIMEOUT = 500; //ms
    private static readonly THROTTLE_WAIT = 50; //ms

    static readonly view = (view: EditorView): PluginView => new this(view);

    private _tabElem: HTMLElement | null = null;
    private _editorView: EditorView;
    private _timeout: ReturnType<typeof setTimeout> | null = null;
    private readonly _docListener;

    constructor(view: EditorView) {
        this._editorView = view;
        this._docListener = throttle(
            this._onDocEvent.bind(this),
            TabsAutoSwitchOnDragOver.THROTTLE_WAIT,
        );
        document.addEventListener('mousemove', this._docListener);
        document.addEventListener('dragover', this._docListener);
    }

    destroy(): void {
        this._clear();
        this._docListener.cancel();
        document.removeEventListener('mousemove', this._docListener);
        document.removeEventListener('dragover', this._docListener);
    }

    private _onDocEvent(event: MouseEvent) {
        const view = this._editorView;
        if (!view.dragging) return;
        const pos = view.posAtCoords({left: event.clientX, top: event.clientY});
        if (pos) {
            const elem = findDomRefAtPos(pos.pos, view.domAtPos.bind(view)) as HTMLElement;
            const cutElem = elem.closest(TabsAutoSwitchOnDragOver.TAB_SELECTOR);
            if (cutElem === this._tabElem) return;
            this._clear();
            if (cutElem) this._setTabElem(cutElem as HTMLElement);
        }
    }

    private _clear() {
        if (this._timeout !== null) clearTimeout(this._timeout);
        this._timeout = null;
        this._tabElem = null;
    }

    private _setTabElem(elem: HTMLElement) {
        this._tabElem = elem;
        this._timeout = setTimeout(
            this._switchTab.bind(this),
            TabsAutoSwitchOnDragOver.OPEN_TIMEOUT,
        );
    }

    private _switchTab() {
        if (this._editorView.dragging && this._tabElem) {
            const pos = this._editorView.posAtDOM(this._tabElem, 0, -1);
            const $pos = this._editorView.state.doc.resolve(pos);
            const {state} = this._editorView;

            let {depth} = $pos;
            let tabId = '';
            let tabsNode: NodeWithPos | null = null;
            do {
                const node = $pos.node(depth);
                if (node.type === tabType(state.schema)) {
                    tabId = node.attrs[TabAttrs.dataDiplodocid];
                    continue;
                }

                if (node.type === tabsType(state.schema)) {
                    tabsNode = {node, pos: $pos.before(depth)};
                    break;
                }
            } while (--depth >= 0);

            if (tabId && tabsNode) {
                const {tr} = state;
                if (switchYfmTab(tabsNode, tabId, tr)) {
                    this._editorView.dispatch(tr.setMeta('addToHistory', false));
                }
            }
        }
        this._clear();
    }
}

function switchYfmTab(
    {node: tabsNode, pos: tabsPos}: NodeWithPos,
    tabId: string,
    tr: Transform,
): boolean {
    const {schema} = tabsNode.type;
    if (tabsNode.type !== tabsType(schema)) return false;

    const tabsList = tabsNode.firstChild;
    if (tabsList?.type !== tabsListType(schema)) return false;

    const tabsListPos = tabsPos + 1;

    let panelId: string | null = null;
    tabsList.forEach((node, offset) => {
        if (node.type !== tabType(schema)) return;

        const tabPos = tabsListPos + 1 + offset;
        const tabAttrs = {
            ...node.attrs,
            [TabAttrs.ariaSelected]: 'false',
            [TabAttrs.dataDiplodocIsActive]: 'false',
        };

        if (node.attrs[TabAttrs.dataDiplodocid] === tabId) {
            panelId = node.attrs[TabAttrs.ariaControls];
            tabAttrs[TabAttrs.ariaSelected] = 'true';
            tabAttrs[TabAttrs.dataDiplodocIsActive] = 'true';
        }

        tr.setNodeMarkup(tabPos, null, tabAttrs);
    });

    if (!panelId) return false;

    tabsNode.forEach((node, offset) => {
        if (node.type !== tabPanelType(schema)) return;

        const tabPanelPos = tabsPos + 1 + offset;
        const tabPanelAttrs = {
            ...node.attrs,
        };
        const tabPanelClassList = new Set(
            ((node.attrs[TabPanelAttrs.class] as string) ?? '')
                .split(' ')
                .filter((val) => Boolean(val.trim())),
        );

        if (node.attrs[TabPanelAttrs.id] === panelId) {
            tabPanelClassList.add('active');
        } else {
            tabPanelClassList.delete('active');
        }

        tabPanelAttrs[TabPanelAttrs.class] = Array.from(tabPanelClassList).join(' ');
        tr.setNodeMarkup(tabPanelPos, null, tabPanelAttrs);
    });

    return true;
}

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

export const liftEmptyBlockFromTabPanel: Command = (state, dispatch) => {
    const {selection, schema} = state;
    if (!isTextSelection(selection)) return false;

    const {$cursor} = selection;

    // cursor should be inside an empty textblock
    if (!$cursor || $cursor.parent.content.size) return false;

    if (
        $cursor.depth > 2 && // depth must be at least 3
        isSameNodeType($cursor.node(-1), tabPanelType(schema)) &&
        isSameNodeType($cursor.node(-2), tabsType(schema))
    ) {
        // current texblock is last child
        if ($cursor.after() === $cursor.end(-1)) {
            if (dispatch) {
                const copeidNode = $cursor.parent.copy();
                const tabsAfter = $cursor.after(-2);

                const {tr} = state;

                tr.insert(tabsAfter, copeidNode)
                    .delete($cursor.before(), $cursor.after())
                    .setSelection(TextSelection.create(tr.doc, tr.mapping.map(tabsAfter)));

                dispatch(tr.scrollIntoView());
            }
            return true;
        }
    }
    return false;
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

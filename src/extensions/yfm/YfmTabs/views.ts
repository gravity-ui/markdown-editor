import type {Node} from 'prosemirror-model';
import {type EditorState, TextSelection} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import type {EditorView, NodeViewConstructor, ViewMutationRecord} from 'prosemirror-view';

import {cn} from '../../../classname';

import {tabType, tabsType} from './const';
import {crossSvg, plusSvg} from './icons';
import {createTab, removeTab} from './plugins';
import {execAfterPaint} from './utils';

import './index.scss';

const cnYfmTab = cn('yfm-tab');

const ignoreMutation =
    (_node: Node, _view: EditorView, _getPos: () => number | undefined) =>
    (mutation: ViewMutationRecord) => {
        if (
            mutation instanceof MutationRecord &&
            mutation.type === 'attributes' &&
            mutation.attributeName
        ) {
            return true;
        }

        return false;
    };

const getTabNodes = (state: EditorState, getPos: () => number | undefined) => {
    const currentTab = findParentNodeOfTypeClosestToPos(
        state.tr.doc.resolve(getPos()! + 1),
        tabType(state.schema),
    );
    const tabsParentNode = findParentNodeOfTypeClosestToPos(
        state.tr.doc.resolve(getPos()!),
        tabsType(state.schema),
    );

    return {currentTab, tabsParentNode};
};

export const tabView: NodeViewConstructor = (node, view, getPos) => {
    const tabElem = document.createElement('div');
    const wrapperElem = document.createElement('div');
    wrapperElem.setAttribute('class', cnYfmTab('wrapper'));

    const viewElem = document.createElement('div');
    viewElem.setAttribute('class', cnYfmTab('view'));

    wrapperElem.addEventListener('click', () => {
        // Click on parent node to trigger event listener that selects current tab
        tabElem.click();

        {
            /**
             * Hack for empty tabs
             *
             * Problem: when clicking on an empty tab (without text content) it focuses, and selection doesn't move to beginning of tab
             *
             * Temporary fix: manually return focus to pm-view, move text selection to beginning of tab
             */

            view.focus();

            // tab is empty
            if (node.nodeSize < 3) {
                execAfterPaint(() => {
                    const pos = getPos();
                    if (pos !== undefined) {
                        const {tr} = view.state;
                        view.dispatch(
                            tr.setSelection(TextSelection.create(tr.doc, pos + 1)).scrollIntoView(),
                        );
                    }
                });
            }
        }
    });

    const removeTabButton = document.createElement('div');
    removeTabButton.setAttribute('class', cnYfmTab('remove-button'));
    removeTabButton.innerHTML = crossSvg;
    removeTabButton.contentEditable = 'false';
    removeTabButton.addEventListener('click', () => {
        const {state, dispatch} = view;
        const {currentTab, tabsParentNode} = getTabNodes(state, getPos);

        if (currentTab && tabsParentNode)
            removeTab(currentTab, tabsParentNode)(state, dispatch, view);
    });

    const createTabButton = document.createElement('div');
    createTabButton.setAttribute('class', cnYfmTab('create-button'));
    createTabButton.innerHTML = plusSvg;
    createTabButton.contentEditable = 'false';
    createTabButton.addEventListener('click', () => {
        const {state, dispatch} = view;
        const {currentTab, tabsParentNode} = getTabNodes(state, getPos);

        if (currentTab && tabsParentNode)
            createTab(currentTab, tabsParentNode)(state, dispatch, view);
    });

    tabElem.draggable = false;
    for (const attr in node.attrs) {
        if (Object.prototype.hasOwnProperty.call(node.attrs, attr)) {
            tabElem.setAttribute(attr, node.attrs[attr]);
        }
    }

    wrapperElem.appendChild(viewElem);
    wrapperElem.appendChild(removeTabButton);

    tabElem.appendChild(wrapperElem);
    tabElem.appendChild(createTabButton);

    return {
        dom: tabElem,
        contentDOM: viewElem,
        destroy() {
            tabElem.remove();
        },
        // FIX: ignore mutation and don't rerender node when yfm.js switch tab
        ignoreMutation: ignoreMutation(node, view, getPos),
    };
};

// @ts-expect-error
export const tabPanelView: NodeViewConstructor = (node, view, getPos) => ({
    // FIXME: ignore mutation and don't rerender node when yfm.js switch tab
    ignoreMutation: ignoreMutation(node, view, getPos),
});

// @ts-expect-error
export const vtabView: NodeViewConstructor = (node, view, getPos) => ({
    // FIXME: ignore mutation and don't rerender node when yfm.js switch tab
    ignoreMutation: ignoreMutation(node, view, getPos),
});

// @ts-expect-error
export const vtabInputView: NodeViewConstructor = (node, view, getPos) => ({
    // FIXME: ignore mutation and don't rerender node when yfm.js switch tab
    ignoreMutation: ignoreMutation(node, view, getPos),
});

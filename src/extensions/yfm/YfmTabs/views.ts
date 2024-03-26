import {Node} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {findParentNodeOfTypeClosestToPos} from 'prosemirror-utils';
import {EditorView, NodeViewConstructor} from 'prosemirror-view';

import {cn} from '../../../classname';

import {crossSvg, plusSvg} from './icons';
import {createTab, removeTab} from './plugins';

import {tabType, tabsType} from '.';

import './index.scss';

const cnYfmTab = cn('yfm-tab');

const ignoreMutation =
    (node: Node, view: EditorView, getPos: () => number | undefined) =>
    (mutation: MutationRecord) => {
        if (
            mutation instanceof MutationRecord &&
            mutation.type === 'attributes' &&
            mutation.attributeName
        ) {
            const newAttr = (mutation.target as HTMLElement).getAttribute(mutation.attributeName);

            view.dispatch(
                view.state.tr.setNodeMarkup(getPos()!, null, {
                    ...node.attrs,
                    [mutation.attributeName]: String(newAttr),
                }),
            );
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
    // FIX: ignore mutation and don't rerender node when yfm.js switch tab
    ignoreMutation: ignoreMutation(node, view, getPos),
});

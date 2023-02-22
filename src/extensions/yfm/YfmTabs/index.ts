import type {ExtensionAuto} from '../../../core';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {tabBackspace, tabPanelBackspace} from './plugins';
import {chainCommands} from 'prosemirror-commands';
import {YfmTabsSpecs} from './YfmTabsSpecs';

const ignoreMutation =
    (node: Node, view: EditorView, getPos: () => number) => (mutation: MutationRecord) => {
        if (
            mutation instanceof MutationRecord &&
            mutation.type === 'attributes' &&
            mutation.attributeName
        ) {
            const newAttr = (mutation.target as HTMLElement).getAttribute(mutation.attributeName);

            view.dispatch(
                view.state.tr.setNodeMarkup(getPos(), null, {
                    ...node.attrs,
                    [mutation.attributeName]: String(newAttr),
                }),
            );
            return true;
        }

        return false;
    };

export {TabsNode, tabType, tabsType, tabsListType, tabPanelType} from './YfmTabsSpecs';

export const YfmTabs: ExtensionAuto = (builder) => {
    builder.use(YfmTabsSpecs, {
        // @ts-expect-error
        tabView:
            // FIX: ignore mutation and don't rerender node when yfm.js switch tab
            () => (node, view, getPos) => ({
                ignoreMutation: ignoreMutation(node, view, getPos),
            }),
        // @ts-expect-error
        tabPanelView:
            // FIX: ignore mutation and don't rerender node when yfm.js switch tab
            () => (node, view, getPos) => ({
                ignoreMutation: ignoreMutation(node, view, getPos),
            }),
    });

    builder.addKeymap(() => ({
        Backspace: chainCommands(tabPanelBackspace, tabBackspace),
    }));
};

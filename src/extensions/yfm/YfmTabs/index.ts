import log from '@doc-tools/transform/lib/log';
import yfmPlugin from '@doc-tools/transform/lib/plugins/tabs';
import type {ExtensionAuto} from '../../../core';
import {toYfm} from './toYfm';
import {TabsNode} from './const';

import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import {tabBackspace, tabPanelBackspace} from './plugins';
import {chainCommands} from 'prosemirror-commands';

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

export const YfmTabs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(yfmPlugin, {log}))
        .addNode(TabsNode.Tab, () => ({
            spec: spec[TabsNode.Tab],
            toYfm: toYfm[TabsNode.Tab],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.Tab],
                tokenName: 'tab',
            },
            // FIX: ignore mutation and don't rerender node when yfm.js switch tab
            // @ts-expect-error
            view: () => (node, view, getPos) => ({
                ignoreMutation: ignoreMutation(node, view, getPos),
            }),
        }))
        .addNode(TabsNode.TabsList, () => ({
            spec: spec[TabsNode.TabsList],
            toYfm: toYfm[TabsNode.TabsList],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.TabsList],
                tokenName: 'tab-list',
            },
        }))
        .addNode(TabsNode.TabPanel, () => ({
            spec: spec[TabsNode.TabPanel],
            toYfm: toYfm[TabsNode.TabPanel],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.TabPanel],
                tokenName: 'tab-panel',
            },
            // FIX: ignore mutation and don't rerender node when yfm.js switch tab
            // @ts-expect-error
            view: () => (node, view, getPos) => ({
                ignoreMutation: ignoreMutation(node, view, getPos),
            }),
        }))
        .addNode(TabsNode.Tabs, () => ({
            spec: spec[TabsNode.Tabs],
            toYfm: toYfm[TabsNode.Tabs],
            fromYfm: {
                tokenSpec: fromYfm[TabsNode.Tabs],
                tokenName: 'tabs',
            },
        }))
        .addKeymap(() => ({
            Backspace: chainCommands(tabPanelBackspace, tabBackspace),
        }));
};

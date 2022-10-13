import {liftListItem, sinkListItem, splitListItem} from 'prosemirror-schema-list';
import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {actions} from './actions';
import {ListAction, ListNode} from './const';
import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {toYfm} from './toYfm';
import {ListsInputRulesExtension, ListsInputRulesOptions} from './inputrules';
import {blType, liType, olType} from './utils';
import {toList} from './commands';

export type ListsOptions = {
    ulKey?: string | null;
    olKey?: string | null;
    ulInputRules?: ListsInputRulesOptions['bulletListInputRule'];
};

export const Lists: ExtensionAuto<ListsOptions> = (builder, opts) => {
    builder
        .addNode(ListNode.ListItem, () => ({
            spec: spec[ListNode.ListItem],
            toYfm: toYfm[ListNode.ListItem],
            fromYfm: {tokenSpec: fromYfm[ListNode.ListItem]},
        }))
        .addNode(ListNode.BulletList, () => ({
            spec: spec[ListNode.BulletList],
            toYfm: toYfm[ListNode.BulletList],
            fromYfm: {tokenSpec: fromYfm[ListNode.BulletList]},
        }))
        .addNode(ListNode.OrderedList, () => ({
            spec: spec[ListNode.OrderedList],
            toYfm: toYfm[ListNode.OrderedList],
            fromYfm: {tokenSpec: fromYfm[ListNode.OrderedList]},
        }));

    builder.addKeymap(({schema}) => {
        const {ulKey, olKey} = opts ?? {};
        const bindings: Keymap = {};
        if (ulKey) bindings[ulKey] = toList(blType(schema));
        if (olKey) bindings[olKey] = toList(olType(schema));

        return {
            Enter: splitListItem(liType(schema)),
            Tab: sinkListItem(liType(schema)),
            'Shift-Tab': liftListItem(liType(schema)),

            'Mod-[': liftListItem(liType(schema)),
            'Mod-]': sinkListItem(liType(schema)),

            ...bindings,
        };
    });

    builder.use(ListsInputRulesExtension, {bulletListInputRule: opts?.ulInputRules});

    builder
        .addAction(ListAction.ToBulletList, actions.toBulletList)
        .addAction(ListAction.ToOrderedList, actions.toOrderedList)
        .addAction(ListAction.SinkListItem, actions.sinkListItem)
        .addAction(ListAction.LiftListItem, actions.liftListItem);
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [ListAction.ToBulletList]: Action;
            [ListAction.ToOrderedList]: Action;
            [ListAction.SinkListItem]: Action;
            [ListAction.LiftListItem]: Action;
        }
    }
}

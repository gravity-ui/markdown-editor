import {liftListItem, sinkListItem, splitListItem} from 'prosemirror-schema-list';

import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {withLogAction} from '../../../utils/keymap';

import {ListsSpecs, blType, liType, olType} from './ListsSpecs';
import {actions} from './actions';
import {joinPrevList, toList} from './commands';
import {ListAction} from './const';
import {ListsInputRulesExtension, ListsInputRulesOptions} from './inputrules';
import {mergeListsPlugin} from './plugins/MergeListsPlugin';

export {ListNode, ListsAttr, blType, liType, olType} from './ListsSpecs';

export type ListsOptions = {
    ulKey?: string | null;
    olKey?: string | null;
    ulInputRules?: ListsInputRulesOptions['bulletListInputRule'];
};

export const Lists: ExtensionAuto<ListsOptions> = (builder, opts) => {
    builder.use(ListsSpecs);

    builder.addKeymap(({schema}) => {
        const {ulKey, olKey} = opts ?? {};
        const bindings: Keymap = {};
        if (ulKey) bindings[ulKey] = withLogAction('bulletList', toList(blType(schema)));
        if (olKey) bindings[olKey] = withLogAction('orderedList', toList(olType(schema)));

        return {
            Tab: sinkListItem(liType(schema)),
            'Shift-Tab': liftListItem(liType(schema)),

            'Mod-[': liftListItem(liType(schema)),
            'Mod-]': sinkListItem(liType(schema)),

            ...bindings,
        };
    }, builder.Priority.High);

    builder.addKeymap(
        ({schema}) => ({
            Enter: splitListItem(liType(schema)),
            Backspace: joinPrevList,
        }),
        builder.Priority.Low,
    );

    builder.use(ListsInputRulesExtension, {bulletListInputRule: opts?.ulInputRules});

    builder.addPlugin(mergeListsPlugin);

    builder
        .addAction(ListAction.ToBulletList, actions.toBulletList)
        .addAction(ListAction.ToOrderedList, actions.toOrderedList)
        .addAction(ListAction.SinkListItem, actions.sinkListItem)
        .addAction(ListAction.LiftListItem, actions.liftListItem);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [ListAction.ToBulletList]: Action;
            [ListAction.ToOrderedList]: Action;
            [ListAction.SinkListItem]: Action;
            [ListAction.LiftListItem]: Action;
        }
    }
}

import type {ExtensionAuto} from '../../../core';
import {DeflistNode, TableNode} from '../../../extensions/markdown';
import {CheckboxNode, CutNode, TabsNode, YfmNoteNode} from '../../../extensions/yfm';
import {logger} from '../../../logger';
import {Autocomplete, AutocompleteItemFn} from '../Autocomplete';

import {DecoClassName} from './const';
import {CommandHandler} from './handler';
import type {Config} from './types';

export type CommandMenuOptions = {
    actions: Config;
    nodesIgnoreList?: readonly string[];
};

const getCommandMenuAutocompleteItem =
    (opts: CommandMenuOptions): AutocompleteItemFn =>
    ({actions}) => ({
        trigger: {
            name: 'command',
            trigger: /(?:^|\s)(\/)$/,
            allArrowKeys: false,
            cancelOnFirstSpace: true,
            decorationAttrs: {class: DecoClassName},
        },
        handler: new CommandHandler({
            storage: actions,
            actions: opts.actions,
            // TODO: add commandMenu=false flag to specs:
            nodesIgnoreList: (opts.nodesIgnoreList ?? []).concat([
                DeflistNode.Term,
                TableNode.HeaderCell,
                TableNode.DataCell,
                CheckboxNode.Label,
                YfmNoteNode.NoteTitle,
                CutNode.CutTitle,
                TabsNode.Tab,
            ]),
        }),
    });

export const CommandMenu: ExtensionAuto<CommandMenuOptions> = (builder, opts) => {
    if (!Array.isArray(opts.actions) || opts.actions.length === 0) {
        logger.info("[CommandMenu extension]: Skip because 'actions' is not an array or is empty");
        return;
    }
    if (!builder.context.has('autocomplete')) {
        builder.use(Autocomplete);
    }
    builder.context.get('autocomplete')!.add(getCommandMenuAutocompleteItem(opts));
};

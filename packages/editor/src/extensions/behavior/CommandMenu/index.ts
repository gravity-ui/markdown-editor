import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';
import {DeflistNode, TableNode} from '../../../extensions/markdown';
import {CheckboxNode, CutNode, TabsNode, YfmNoteNode} from '../../../extensions/yfm';
import type {Logger2} from '../../../logger';
import {Autocomplete, type AutocompleteItemFn} from '../Autocomplete';

import {DecoClassName} from './const';
import {CommandHandler} from './handler';
import type {Config} from './types';

export type CommandMenuOptions = {
    /** @deprecated Use `toolbarsPreset.orders.wysiwygSlash` on MarkdownEditorView. */
    actions: Config;
    nodesIgnoreList?: readonly string[];
};

const getCommandMenuAutocompleteItem =
    (
        opts: CommandMenuOptions,
        logger: Logger2.ILogger,
        onCreate: (handler: CommandHandler) => void,
    ): AutocompleteItemFn =>
    ({actions}) => {
        const handler = new CommandHandler({
            logger,
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
        });
        onCreate(handler);
        return {
            trigger: {
                name: 'command',
                trigger: /(?:^|\s)(\/)$/,
                allArrowKeys: false,
                cancelOnFirstSpace: true,
                decorationAttrs: {class: DecoClassName},
            },
            handler,
        };
    };

export const CommandMenu: ExtensionAuto<CommandMenuOptions> = (builder, opts) => {
    // Keep the trigger available for toolbars supplied later by the editor view.
    if (!builder.context.has('autocomplete')) {
        builder.use(Autocomplete);
    }
    let handler: CommandHandler | undefined;
    builder.context.get('autocomplete')!.add(
        getCommandMenuAutocompleteItem(opts, builder.logger, (created) => {
            handler = created;
        }),
    );
    builder.addPlugin(
        () =>
            new Plugin({
                view: () => ({update: (view, prevState) => handler?.update(view, prevState)}),
            }),
    );
};

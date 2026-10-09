import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';
import {DeflistNode, TableNode} from '../../../extensions/markdown';
import {CheckboxNode, CutNode, TabsNode, YfmNoteNode} from '../../../extensions/yfm';
import {Autocomplete} from '../Autocomplete';

import {DecoClassName} from './const';
import {CommandHandler} from './handler';
import type {Config} from './types';

export type CommandMenuOptions = {
    /** @deprecated Use `toolbarsPreset.orders.wysiwygSlash` on MarkdownEditorView. */
    actions: Config;
    nodesIgnoreList?: readonly string[];
};

export const CommandMenu: ExtensionAuto<CommandMenuOptions> = (builder, opts) => {
    // Keep the trigger available for toolbars supplied later by the editor view.
    if (!builder.context.has('autocomplete')) {
        builder.use(Autocomplete);
    }
    let handler: CommandHandler | undefined;
    builder.context.get('autocomplete')!.add(({actions}) => {
        handler = new CommandHandler({
            logger: builder.logger,
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
    });
    builder.addPlugin(
        () =>
            new Plugin({
                view: () => ({update: (view, prevState) => handler?.update(view, prevState)}),
            }),
    );
};

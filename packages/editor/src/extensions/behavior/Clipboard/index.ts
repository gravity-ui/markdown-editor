import type {Slice} from 'prosemirror-model';

import type {ExtensionAuto, Parser} from '#core';

import {type ClipboardPluginOptions, clipboard} from './clipboard';
import {handlePasteIntoCodePlugin} from './code';
import {matrixClipboard} from './matrix-clipboard';
import * as clipboardUtils from './utils';

export {clipboardUtils};

export type ClipboardOptions = Pick<ClipboardPluginOptions, 'pasteFileHandler'>;

export const Clipboard: ExtensionAuto<ClipboardOptions> = (builder, opts) => {
    builder.addPlugin(
        (deps) =>
            builder.context.get('tableCellSelection')
                ? matrixClipboard({
                      logger: builder.logger.nested({module: 'clipboard', plugin: 'matrix'}),
                      mdParser: deps.markupParser,
                      textParser: deps.textParser,
                      parseTableText: builder.context.get('parseClipboardTableText'),
                      serializer: deps.serializer,
                      pasteFileHandler: opts.pasteFileHandler,
                  })
                : [],
        builder.Priority.Highest + 1,
    );
    builder.addPlugin(
        (deps) =>
            clipboard({
                logger: builder.logger.nested({
                    module: 'clipboard',
                    plugin: 'clipboard',
                }),
                mdParser: deps.markupParser,
                textParser: deps.textParser,
                serializer: deps.serializer,
                pasteFileHandler: opts.pasteFileHandler,
            }),
        builder.Priority.VeryLow,
    );

    builder.addPlugin(handlePasteIntoCodePlugin, builder.Priority.Highest);
};

declare global {
    namespace WysiwygEditor {
        interface Context {
            parseClipboardTableText?: (text: string, parser: Parser) => Slice | null;
        }
    }
}

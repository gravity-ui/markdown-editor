import type {ExtensionAuto} from '#core';

import {type ClipboardPluginOptions, clipboard} from './clipboard';
import {handlePasteIntoCodePlugin} from './code';
import * as clipboardUtils from './utils';

export {clipboardUtils};

export type ClipboardOptions = Pick<ClipboardPluginOptions, 'pasteFileHandler'>;

export const Clipboard: ExtensionAuto<ClipboardOptions> = (builder, opts) => {
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

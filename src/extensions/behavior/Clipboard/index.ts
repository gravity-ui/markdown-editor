import type {ExtensionAuto} from '../../../core';
import {clipboard, ClipboardPluginOptions} from './clipboard';
import * as clipboardUtils from './utils';

export {clipboardUtils};

export type ClipboardOptions = Pick<ClipboardPluginOptions, 'pasteFileHandler'>;

export const Clipboard: ExtensionAuto<ClipboardOptions> = (builder, opts) => {
    builder.addPlugin(
        (deps) =>
            clipboard({
                yfmParser: deps.parser,
                textParser: deps.parserWithoutAttrs,
                serializer: deps.serializer,
                pasteFileHandler: opts.pasteFileHandler,
            }),
        builder.PluginPriority.VeryLow,
    );
};

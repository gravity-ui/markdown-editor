import type {ExtensionAuto} from '../../../core';

import {ClipboardPluginOptions, clipboard} from './clipboard';
import * as clipboardUtils from './utils';

export {clipboardUtils};

export type ClipboardOptions = Pick<ClipboardPluginOptions, 'pasteFileHandler'>;

export const Clipboard: ExtensionAuto<ClipboardOptions> = (builder, opts) => {
    builder.addPlugin(
        (deps) =>
            clipboard({
                mdParser: deps.markupParser,
                textParser: deps.textParser,
                serializer: deps.serializer,
                pasteFileHandler: opts.pasteFileHandler,
            }),
        builder.PluginPriority.VeryLow,
    );
};

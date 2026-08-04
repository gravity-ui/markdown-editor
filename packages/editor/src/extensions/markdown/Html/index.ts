import type {ExtensionAuto} from '#core';
import {globalLogger} from 'src/logger';

import {HtmlParserSpecs} from './parser';
import {HtmlSchemaSpecs} from './schema';
import {HtmlSerializerSpecs} from './serializer';

export {HtmlAttr, HtmlNode} from './const';

export const Html: ExtensionAuto = (builder) => {
    if (builder.context.has('html') && builder.context.get('html') === false) {
        globalLogger.info('[HTML extension]: Skip extension, because HTML disabled via context');
        builder.logger.log('[HTML extension]: Skip extension, because HTML disabled via context');
        return;
    }

    builder.use(HtmlSchemaSpecs).use(HtmlParserSpecs).use(HtmlSerializerSpecs);
};

declare global {
    namespace WysiwygEditor {
        interface Context {
            /**
             * Same as @type {MarkdownIt.Options.html}
             */
            html: boolean;
        }
    }
}

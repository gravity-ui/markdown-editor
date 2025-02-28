import type {ExtensionAuto} from '../../../core';
import {globalLogger} from '../../../logger';

import {HtmlNode} from './const';
import {parserTokens} from './parser';
import {schemaSpecs} from './schema';
import {serializerTokens} from './serializer';

export {HtmlAttr, HtmlNode} from './const';

export const Html: ExtensionAuto = (builder) => {
    if (builder.context.has('html') && builder.context.get('html') === false) {
        globalLogger.info('[HTML extension]: Skip extension, because HTML disabled via context');
        builder.logger.log('[HTML extension]: Skip extension, because HTML disabled via context');
        return;
    }

    builder.addNode(HtmlNode.Block, () => ({
        spec: schemaSpecs[HtmlNode.Block],
        fromMd: {tokenSpec: parserTokens[HtmlNode.Block]},
        toMd: serializerTokens[HtmlNode.Block],
    }));

    builder.addNode(HtmlNode.Inline, () => ({
        spec: schemaSpecs[HtmlNode.Inline],
        fromMd: {tokenSpec: parserTokens[HtmlNode.Inline]},
        toMd: serializerTokens[HtmlNode.Inline],
    }));
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

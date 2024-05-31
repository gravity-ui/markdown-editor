import type {ExtensionAuto} from '../../../core';
import {logger} from '../../../logger';

import {HtmlNode} from './const';
import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {toYfm} from './toYfm';

export {HtmlAttr, HtmlNode} from './const';

export const Html: ExtensionAuto = (builder) => {
    if (builder.context.has('html') && builder.context.get('html') === false) {
        logger.info('[HTML extension]: Skip extension, because HTML disabled via context');
        return;
    }

    builder.addNode(HtmlNode.Block, () => ({
        spec: spec[HtmlNode.Block],
        fromMd: {tokenSpec: fromYfm[HtmlNode.Block]},
        toMd: toYfm[HtmlNode.Block],
    }));

    builder.addNode(HtmlNode.Inline, () => ({
        spec: spec[HtmlNode.Inline],
        fromMd: {tokenSpec: fromYfm[HtmlNode.Inline]},
        toMd: toYfm[HtmlNode.Inline],
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

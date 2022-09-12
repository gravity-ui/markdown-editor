import {createExtension, ExtensionAuto} from '../../../core';
import {HtmlNode} from './const';
import {fromYfm} from './fromYfm';
import {spec} from './spec';
import {toYfm} from './toYfm';

export const Html: ExtensionAuto = (builder) => {
    builder.addNode(HtmlNode.Block, () => ({
        spec: spec[HtmlNode.Block],
        fromYfm: {tokenSpec: fromYfm[HtmlNode.Block]},
        toYfm: toYfm[HtmlNode.Block],
    }));

    builder.addNode(HtmlNode.Inline, () => ({
        spec: spec[HtmlNode.Inline],
        fromYfm: {tokenSpec: fromYfm[HtmlNode.Inline]},
        toYfm: toYfm[HtmlNode.Inline],
    }));
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const HtmlE = createExtension((b, o = {}) => b.use(Html, o));

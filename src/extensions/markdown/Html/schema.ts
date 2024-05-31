import sanitize from '@diplodoc/transform/lib/sanitize';
import type {NodeSpec} from 'prosemirror-model';

import {HtmlAttr, HtmlNode} from './const';

enum DomAttr {
    Html = 'data-html',
    HtmlRaw = 'data-html-raw',
}

export const schemaSpecs: Record<HtmlNode, NodeSpec> = {
    [HtmlNode.Block]: {
        atom: true,
        group: 'block',
        attrs: {[HtmlAttr.Content]: {}},
        parseDOM: [
            {
                tag: `div[${DomAttr.Html}]`,
                getAttrs(dom) {
                    const dom_ = dom as HTMLElement;
                    return {
                        [HtmlAttr.Content]: dom_.getAttribute(DomAttr.HtmlRaw) || dom_.innerHTML,
                    };
                },
            },
        ],
        toDOM(node) {
            const htmlContent = node.attrs[HtmlAttr.Content] as string;
            const elem = document.createElement('div');
            elem.setAttribute(DomAttr.Html, '');
            elem.setAttribute(DomAttr.HtmlRaw, htmlContent);
            elem.contentEditable = 'false';
            elem.innerHTML = sanitize(htmlContent);
            return elem;
        },
    },

    [HtmlNode.Inline]: {
        atom: true,
        inline: true,
        group: 'inline',
        attrs: {[HtmlAttr.Content]: {}},
        parseDOM: [
            {
                tag: `span[${DomAttr.Html}]`,
                getAttrs(dom) {
                    return {[HtmlAttr.Content]: (dom as HTMLElement).textContent};
                },
            },
        ],
        toDOM(node) {
            const elem = document.createElement('span');
            elem.setAttribute(DomAttr.Html, '');
            elem.contentEditable = 'false';
            elem.textContent = node.attrs[HtmlAttr.Content];
            return elem;
        },
    },
};

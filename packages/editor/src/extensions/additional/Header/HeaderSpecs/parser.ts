import type {ParserToken} from '#core';

import {normalizeHeaderActionAttrs, normalizeHeaderAttrs} from './attrs';
import {HeaderActionAttr, HeaderAttr, HeaderNode, type HeaderNodeName} from './const';

/** noCloseToken reads literal text from each slot's token content. */
export const parserTokens: Record<HeaderNodeName, ParserToken> = {
    [HeaderNode.Header]: {
        name: HeaderNode.Header,
        type: 'block',
        getAttrs: (token) => {
            const raw: Record<string, string | null> = {};
            for (const key of Object.values(HeaderAttr)) {
                raw[key] = token.attrGet(`data-${key}`);
            }
            return normalizeHeaderAttrs(raw);
        },
    },
    [HeaderNode.Title]: {name: HeaderNode.Title, type: 'block', noCloseToken: true},
    [HeaderNode.Description]: {name: HeaderNode.Description, type: 'block', noCloseToken: true},
    [HeaderNode.Actions]: {name: HeaderNode.Actions, type: 'block'},
    [HeaderNode.Action]: {
        name: HeaderNode.Action,
        type: 'block',
        noCloseToken: true,
        getAttrs: (token) =>
            normalizeHeaderActionAttrs({
                [HeaderActionAttr.Type]: token.attrGet(`data-${HeaderActionAttr.Type}`),
                [HeaderActionAttr.Href]: token.attrGet(HeaderActionAttr.Href),
            }),
    },
};

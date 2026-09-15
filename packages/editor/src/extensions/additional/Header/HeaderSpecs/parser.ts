import type {ParserToken} from '#core';

import {normalizeHeaderActionAttrs, normalizeHeaderAttrs} from './attrs';
import {HeaderActionAttr, HeaderAttr, HeaderNode, type HeaderNodeName} from './const';

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
    [HeaderNode.Title]: {name: HeaderNode.Title, type: 'block'},
    [HeaderNode.Subtitle]: {name: HeaderNode.Subtitle, type: 'block'},
    [HeaderNode.Actions]: {name: HeaderNode.Actions, type: 'block'},
    [HeaderNode.Action]: {
        name: HeaderNode.Action,
        type: 'block',
        getAttrs: (token) =>
            normalizeHeaderActionAttrs({
                [HeaderActionAttr.Href]: token.attrGet(HeaderActionAttr.Href),
                [HeaderActionAttr.Variant]: token.attrGet('data-variant'),
            }),
    },
};

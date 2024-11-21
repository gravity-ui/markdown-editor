import type {ParserToken} from '../../../../core';

import {CutAttr, CutNode} from './const';

const getAttrs: ParserToken['getAttrs'] = (tok) => {
    const nodeAttrs = tok.attrs ? Object.fromEntries(tok.attrs) : {};
    nodeAttrs[CutAttr.Markup] = tok.markup;
    return nodeAttrs;
};

export const parserTokens: Record<CutNode, ParserToken> = {
    [CutNode.Cut]: {name: CutNode.Cut, type: 'block', getAttrs},
    [CutNode.CutTitle]: {name: CutNode.CutTitle, type: 'block'},
    [CutNode.CutContent]: {name: CutNode.CutContent, type: 'block'},
};

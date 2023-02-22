import type {ParserToken} from '../../../../core';
import {CutNode} from './const';

const getAttrs: ParserToken['getAttrs'] = (tok) => (tok.attrs ? Object.fromEntries(tok.attrs) : {});

export const fromYfm: Record<CutNode, ParserToken> = {
    [CutNode.Cut]: {name: CutNode.Cut, type: 'block', getAttrs},
    [CutNode.CutTitle]: {name: CutNode.CutTitle, type: 'block'},
    [CutNode.CutContent]: {name: CutNode.CutContent, type: 'block'},
};

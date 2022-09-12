import type {ParserToken} from '../../../core';
import {DeflistNode} from './const';

export const fromYfm: Record<DeflistNode, ParserToken> = {
    [DeflistNode.List]: {name: DeflistNode.List, type: 'block'},

    [DeflistNode.Term]: {name: DeflistNode.Term, type: 'block'},

    [DeflistNode.Desc]: {name: DeflistNode.Desc, type: 'block'},
};

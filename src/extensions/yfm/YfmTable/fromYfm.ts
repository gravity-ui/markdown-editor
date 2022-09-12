import type {ParserToken} from '../../../core';
import {YfmTableNode} from './const';

export const fromYfm: Record<YfmTableNode, ParserToken> = {
    [YfmTableNode.Table]: {name: YfmTableNode.Table, type: 'block'},

    [YfmTableNode.Body]: {name: YfmTableNode.Body, type: 'block'},

    [YfmTableNode.Row]: {name: YfmTableNode.Row, type: 'block'},

    [YfmTableNode.Cell]: {name: YfmTableNode.Cell, type: 'block'},
};

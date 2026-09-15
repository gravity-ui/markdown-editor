import type Token from 'markdown-it/lib/token';

import type {ExtensionAuto, ParserToken} from '#core';

import {CellAlign, TableAttrs, TableNode} from '../const';

const parserTokens: Record<TableNode, ParserToken> = {
    [TableNode.Table]: {name: TableNode.Table, type: 'block'},

    [TableNode.Head]: {name: TableNode.Head, type: 'block'},

    [TableNode.Body]: {name: TableNode.Body, type: 'block'},

    [TableNode.Row]: {
        name: TableNode.Row,
        type: 'block',
        getAttrs(token) {
            return {
                [TableAttrs.Line]: token.attrGet('data-line'),
            };
        },
    },

    [TableNode.HeaderCell]: {
        name: TableNode.HeaderCell,
        type: 'block',
        getAttrs: getTableCellAttrs,
    },

    [TableNode.DataCell]: {name: TableNode.DataCell, type: 'block', getAttrs: getTableCellAttrs},
};

function getTableCellAttrs({attrs}: Token) {
    const objAttrs = Object.fromEntries(attrs || []);
    let align: string = CellAlign.Left;

    if (objAttrs.style) {
        const styles = objAttrs.style.split(';');
        const textAlignStyle = styles.find((str) => str.startsWith('text-align:')) || '';
        [, align = CellAlign.Left] = textAlignStyle.split(':');
    }

    return {[TableAttrs.CellAlign]: align};
}

export const TableParserSpecs: ExtensionAuto = (builder) => {
    builder
        .addMarkdownTokenParserSpec(TableNode.Table, () => parserTokens[TableNode.Table])
        .addMarkdownTokenParserSpec(TableNode.Head, () => parserTokens[TableNode.Head])
        .addMarkdownTokenParserSpec(TableNode.Body, () => parserTokens[TableNode.Body])
        .addMarkdownTokenParserSpec(TableNode.Row, () => parserTokens[TableNode.Row])
        .addMarkdownTokenParserSpec(TableNode.HeaderCell, () => parserTokens[TableNode.HeaderCell])
        .addMarkdownTokenParserSpec(TableNode.DataCell, () => parserTokens[TableNode.DataCell]);
};

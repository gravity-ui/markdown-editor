import Token from 'markdown-it/lib/token';

import {blackList, blockRatio, previosBlockRatio} from './constants';

export type EmptyTokenParserType = {
    tag: string;
    start: number;
    end: number;
};

export type PreviosBlockInfo = {
    index: number;
    blockName: string;
    isTab: number;
};

export const getRowIndex = (row: EmptyTokenParserType, _previosRow: PreviosBlockInfo) => {
    const ratio = blockRatio[row.tag] || 0;

    return row.start + ratio;
};

export const getPreviosRowIndex = (_row: EmptyTokenParserType, previosRow: PreviosBlockInfo) => {
    const ratio = previosBlockRatio[previosRow.blockName] || 0;

    return previosRow.index + ratio;
};

export const cornerRules: {
    [key: string]: (row: EmptyTokenParserType, previosRow: PreviosBlockInfo) => number;
} = {
    tabs: (row: EmptyTokenParserType, previosRow: PreviosBlockInfo) => {
        let rowIndex = getRowIndex(row, previosRow);
        const previosRowIndex = getPreviosRowIndex(row, previosRow);

        rowIndex -= previosRow.isTab > 1 ? 2 : 1;

        if (previosRow.isTab > 1) {
            const rows = (rowIndex - previosRowIndex - 1) / 2;

            return rows;
        }

        return rowIndex - previosRowIndex - 1;
    },
};

export const normilize = (token: Token) => {
    return {
        tag: token.type.replaceAll('_open', '').replaceAll('_close', ''),
        start: token?.map?.[0] || -1,
        end: token?.map?.[1] || -1,
    };
};

export const checkRow = (row: EmptyTokenParserType, previosTokenData: PreviosBlockInfo) => {
    if (!blackList.includes(row.tag) && row) {
        if (cornerRules[row.tag]) {
            return cornerRules[row.tag](row, previosTokenData);
        }

        const rowIndex = getRowIndex(row, previosTokenData);
        const previosRowIndex = getPreviosRowIndex(row, previosTokenData);

        if (rowIndex === -1 || previosRowIndex === -1) return 0;

        if (rowIndex >= previosRowIndex + 2) {
            if (previosTokenData.isTab) {
                const rows = (rowIndex - previosRowIndex - 1) / 2;

                return rows;
            }

            return rowIndex - previosRowIndex - 1;
        }
    }

    return 0;
};

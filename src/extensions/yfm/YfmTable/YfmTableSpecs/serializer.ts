import isNumber from 'is-number';

import type {SerializerNodeToken} from '../../../../core';

import {YfmTableAttr, YfmTableNode} from './const';

export const serializerTokens: Record<YfmTableNode, SerializerNodeToken> = {
    [YfmTableNode.Table]: (state, node) => {
        state.ensureNewLine();
        state.write('#|');
        state.ensureNewLine();
        state.renderContent(node);
        state.write('|#');
        state.ensureNewLine();
        state.closeBlock();
        state.write('\n');
    },

    [YfmTableNode.Body]: (state, tbody) => {
        const rowspanStack: Record<number, number> = {};

        tbody.forEach((trow) => {
            state.write('||');
            state.ensureNewLine();
            state.write('\n');

            let colIndex = 0;
            trow.forEach((td) => {
                while (colIndex in rowspanStack && rowspanStack[colIndex] > 0) {
                    state.write(colIndex === 0 ? '^' : '|^');
                    rowspanStack[colIndex]--;
                    colIndex++;
                }

                let rowspan = -1;
                if (isNumber(td.attrs[YfmTableAttr.Rowspan])) {
                    rowspan = Math.max(0, Number.parseInt(td.attrs[YfmTableAttr.Rowspan], 10));
                    rowspanStack[colIndex] = rowspan - 1;
                }

                if (colIndex > 0) {
                    state.write('|');
                    state.ensureNewLine();
                    state.write('\n');
                }
                state.renderContent(td);
                if (td.attrs[YfmTableAttr.CellAlign]) {
                    state.write(`{.${td.attrs[YfmTableAttr.CellAlign]}}`);
                    state.ensureNewLine();
                }
                colIndex++;

                if (isNumber(td.attrs[YfmTableAttr.Colspan])) {
                    let colspan = Math.max(0, Number.parseInt(td.attrs[YfmTableAttr.Colspan], 10));
                    while (--colspan > 0) {
                        state.write('|>');
                        if (rowspan > 0) rowspanStack[colIndex] = rowspan - 1;
                        colIndex++;
                    }
                }

                const isLastCell = trow.lastChild === td;
                if (isLastCell) {
                    while (colIndex in rowspanStack && rowspanStack[colIndex] > 0) {
                        state.write('|^');
                        rowspanStack[colIndex]--;
                        colIndex++;
                    }
                }
            });

            state.ensureNewLine();
            state.write('||');
            state.ensureNewLine();
        });
    },

    [YfmTableNode.Row]: (_state, node) => {
        throw new Error(`Should not serialize ${node.type.name} node via serialize-token`);
    },

    [YfmTableNode.Cell]: (_state, node) => {
        throw new Error(`Should not serialize ${node.type.name} node via serialize-token`);
    },
};

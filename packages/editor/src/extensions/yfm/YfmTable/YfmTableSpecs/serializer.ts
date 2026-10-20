import isNumber from 'is-number';

import type {ExtensionAuto} from '#core';
import type {Node} from '#pm/model';

import {YfmTableAttr, YfmTableNode} from './const';

export type YfmTableSerializerOptions = {
    /**
     * Writes cell alignment as `::{align="..."}` instead of a content class.
     * Available with @diplodoc/transform v4.75.0 or higher.
     * @default false
     */
    // TODO [MAJOR]: require transform >=4.75.0, enable by default,
    // and remove newCellAlignSyntax.
    newCellAlignSyntax?: boolean;
};

export const YfmTableSerializerSpecs: ExtensionAuto<YfmTableSerializerOptions> = (
    builder,
    options,
) => {
    const newCellAlignSyntax = options.newCellAlignSyntax === true;
    builder
        .addNodeSerializerSpec(YfmTableNode.Table, () => (state, node) => {
            state.ensureNewLine();
            state.write('#|');
            state.ensureNewLine();

            const headerRows = Number(node.attrs[YfmTableAttr.HeaderRows]) || 0;
            if (headerRows > 0) {
                state.write(`|:{header-rows="${headerRows}"}`);
                state.ensureNewLine();
            }

            state.renderContent(node);
            state.write('|#');
            state.ensureNewLine();
            state.closeBlock();
            state.write('\n');
        })
        .addNodeSerializerSpec(YfmTableNode.Body, () => (state, tbody) => {
            const rowspanStack: Record<number, number> = {};

            tbody.forEach((trow) => {
                const firstCellAttrs =
                    newCellAlignSyntax && rowspanStack[0] > 0
                        ? ''
                        : serializeCellAttrs(trow.firstChild, newCellAlignSyntax);
                state.write(`||${firstCellAttrs}`);
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
                        const cellAttrs = serializeCellAttrs(td, newCellAlignSyntax);
                        state.write(cellAttrs ? `|${cellAttrs}` : '|');
                        state.ensureNewLine();
                        state.write('\n');
                    }
                    state.renderContent(td);
                    if (td.attrs[YfmTableAttr.CellAlign] && !newCellAlignSyntax) {
                        state.write(`{.${td.attrs[YfmTableAttr.CellAlign]}}`);
                        state.ensureNewLine();
                    }
                    colIndex++;

                    if (isNumber(td.attrs[YfmTableAttr.Colspan])) {
                        let colspan = Math.max(
                            0,
                            Number.parseInt(td.attrs[YfmTableAttr.Colspan], 10),
                        );
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
        })
        .addNodeSerializerSpec(YfmTableNode.Row, () => (state, node) => {
            console.warn(`Should not serialize ${node.type.name} node via serialize-token`);

            state.write('||');
            state.ensureNewLine();
            state.write('\n');
            state.renderContent(node);
            state.write('||');
            state.ensureNewLine();
        })
        .addNodeSerializerSpec(YfmTableNode.Cell, () => (state, node, parent) => {
            console.warn(`Should not serialize ${node.type.name} node via serialize-token`);

            state.renderContent(node);

            const isLastCellInRow = parent.lastChild === node;
            if (!isLastCellInRow) {
                state.write('|');
                state.ensureNewLine();
                state.write('\n');
            }
        });
};

function serializeCellAttrs(node: Node | null, newCellAlignSyntax: boolean): string {
    const attrs: string[] = [];
    const cellBg = node?.attrs[YfmTableAttr.CellBg];
    const cellAlign = node?.attrs[YfmTableAttr.CellAlign];

    if (typeof cellBg === 'string') attrs.push(`bg="${cellBg}"`);
    if (newCellAlignSyntax && typeof cellAlign === 'string' && cellAlign) {
        attrs.push(`align="${cellAlign.replace(/^cell-align-/, '')}"`);
    }

    return attrs.length ? `::{${attrs.join(' ')}}` : '';
}

import {describe, expect, it} from 'vitest';

import {mergeSelectedCells} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/commands/merge-selected-cells';
import {splitSelectedCells} from 'src/extensions/yfm/YfmTable/plugins/YfmTableControls/commands/split-selected-cells';

import {applyCommand} from '../utils';
import {
    createSelectedTableState,
    createTableSelectionFixture,
    tableSelectionBuilders,
} from '../yfm-table-selection';

describe.each([false, true])('YFM merge/split with preserveEmptyRows=%s', (preserveEmptyRows) => {
    const {doc, p, table, body, row, cell, reopen} = createTableSelectionFixture(preserveEmptyRows);
    it('should reopen a merged cell and its covered row', () => {
        const original = table(
            body(row(cell(p('Before'), p(), p()), cell(p('After'))), row(cell(p()), cell(p()))),
        );
        const {tr} = applyCommand(
            createSelectedTableState(original, [0, 0], [1, 1]),
            mergeSelectedCells,
        );
        const contents = preserveEmptyRows
            ? [p('Before'), p('\u00a0'), p('\u00a0'), p('After')]
            : [p('Before'), p('After')];
        expect(reopen(tr.doc)).toMatchNodeJson(
            doc(table(body(row(cell({colspan: '2', rowspan: '2'}, ...contents)), row()))),
        );
    });

    it('should reopen split cells containing only empty paragraphs', () => {
        const original = table(body(row(cell({colspan: 2}, p(), p()))));
        const {tr} = applyCommand(createSelectedTableState(original, [0, 0]), splitSelectedCells);
        expect(tr.doc).toMatchNodeJson(doc(table(body(row(cell(p(), p()), cell(p()))))));
        expect(reopen(tr.doc)).toMatchNodeJson(doc(table(body(row(cell(p()), cell(p()))))));
    });
});

it('should reopen an aligned cell next to a merged column with legacy alignment syntax', () => {
    const {doc, p, table, body, row, cell, reopen} = tableSelectionBuilders;
    const attrs = {'data-bg': 'blue', 'data-cell-align': 'cell-align-center'};
    const original = table(
        body(row(cell(p('A')), cell(p('B'))), row(cell(p('C')), cell(attrs, p('D')))),
    );
    const {tr} = applyCommand(
        createSelectedTableState(original, [0, 0], [1, 0]),
        mergeSelectedCells,
    );
    const merged = cell({rowspan: '2'}, p('A'), p('C'));
    const aligned = cell(attrs, p('D'), p());
    expect(reopen(tr.doc)).toMatchNodeJson(
        doc(table(body(row(merged, cell(p('B'))), row(aligned)))),
    );
});

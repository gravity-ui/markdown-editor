import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from 'src/core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {
    Autocomplete,
    getAutocompleteState,
    openAutocomplete,
} from 'src/extensions/behavior/Autocomplete';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {TableCellSelection, getTableGeometry} from 'src/table-utils/cell-selection';

const {markupParser, plugins} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Autocomplete).use(YfmTable, {controls: false}),
}).build();

describe('Autocomplete selection changes', () => {
    it('should ignore opening a suggestion for selected cells', () => {
        const doc = markupParser.parse('#|\n|| one | two ||\n|#');
        const cell = getTableGeometry(doc.firstChild!)!.cellAt(0, 0)!;
        const view = new EditorView(null, {
            state: EditorState.create({
                doc,
                plugins,
                selection: TableCellSelection.create(doc, cell.offset),
            }),
        });
        try {
            openAutocomplete(view, ':');
            expect(view.state.doc.eq(doc)).toBe(true);
            expect(getAutocompleteState(view.state)?.active).toBe(false);
        } finally {
            view.destroy();
        }
    });

    it('should close a suggestion when its cell is selected', () => {
        const doc = markupParser.parse('#|\n|| one | two ||\n|#');
        const cell = getTableGeometry(doc.firstChild!)!.cellAt(0, 0)!;
        const view = new EditorView(null, {
            state: EditorState.create({
                doc,
                plugins,
                selection: TextSelection.create(doc, cell.offset + 2),
            }),
        });
        try {
            openAutocomplete(view, ':', 'smile');
            expect(getAutocompleteState(view.state)?.active).toBe(true);
            view.dispatch(
                view.state.tr.setSelection(TableCellSelection.create(view.state.doc, cell.offset)),
            );
            expect(getAutocompleteState(view.state)?.active).toBe(false);
            expect(view.state.selection).toBeInstanceOf(TableCellSelection);
            expect(
                view.someProp('handleKeyDown', (handler) =>
                    handler(view, new KeyboardEvent('keydown', {key: 'Enter'})),
                ),
            ).toBeFalsy();
        } finally {
            view.destroy();
        }
    });
});

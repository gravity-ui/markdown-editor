import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {applyCommand} from '../../../../../tests/utils';
import {getSchemaSpecs} from '../YfmTableSpecs/schema';

import {clearSelectedCells} from './backspace';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*'},
        ...getSchemaSpecs(),
    },
});

const {doc, paragraph: p, yfm_table: t, yfm_tbody: tb, yfm_tr: trow, yfm_td: td} = builders(schema);

const templateDoc = doc(
    t(
        tb(
            trow(td(p('qwe')), td(p('rty')), td(p('uio'))),
            trow(td(p('asd')), td(p('fgh')), td(p('jkl'))),
            trow(td(p('zxc')), td(p('vbn')), td(p('m<>'))),
        ),
    ),
);

describe('YfmTable commands', () => {
    describe('clearSelectedCells', () => {
        it('should skip if selection inside one cell', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 35, 38), // cell (1,1)
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(false);
            expect(tr).toBeUndefined();
        });

        it('should clear two adjacent cells', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 35, 45), // cells (1,1) (1,2)
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    t(
                        tb(
                            trow(td(p('qwe')), td(p('rty')), td(p('uio'))),
                            trow(td(p('asd')), td(p('')), td(p(''))),
                            trow(td(p('zxc')), td(p('vbn')), td(p('m<>'))),
                        ),
                    ),
                ),
            );
        });

        it('should clear three selected cells', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 29, 44), // cells (1,0) (1,1) (1,2)
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    t(
                        tb(
                            trow(td(p('qwe')), td(p('rty')), td(p('uio'))),
                            trow(td(p('a')), td(p('')), td(p('l'))),
                            trow(td(p('zxc')), td(p('vbn')), td(p('m<>'))),
                        ),
                    ),
                ),
            );
        });

        it('should clear cells in selected row', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 28, 45), // cells (1,0) (1,1) (1,2)
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    t(
                        tb(
                            trow(td(p('qwe')), td(p('rty')), td(p('uio'))),
                            trow(td(p()), td(p()), td(p())),
                            trow(td(p('zxc')), td(p('vbn')), td(p('m<>'))),
                        ),
                    ),
                ),
            );
        });

        it('should clear selected cells (selection covers intermediate trow)', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 19, 54), // cells (0,2) (1,0) (1,1) (1,2) (2,0)
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    t(
                        tb(
                            trow(td(p('qwe')), td(p('rty')), td(p(''))),
                            trow(td(p()), td(p()), td(p())),
                            trow(td(p('')), td(p('vbn')), td(p('m<>'))),
                        ),
                    ),
                ),
            );
        });

        it('should clear selected cells in first row and clear other rows', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 12, 68), // cells from (0,1) onwards
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    t(
                        tb(
                            trow(td(p('qwe')), td(p('')), td(p(''))),
                            trow(td(p()), td(p()), td(p())),
                            trow(td(p()), td(p()), td(p())),
                        ),
                    ),
                ),
            );
        });

        it('should delete table', () => {
            const state = EditorState.create({
                schema,
                doc: templateDoc,
                selection: TextSelection.create(templateDoc, 5, 68), // all cells
            });

            const {res, tr} = applyCommand(state, clearSelectedCells);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(doc(p('')));
        });
    });
});

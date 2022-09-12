import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import type {} from '../index';
import {TableRole} from '../const';
import {transpose} from './transpose';
import {applyCommand} from '../../../tests/utils';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        para: {group: 'block', content: 'inline*'},
        table: {
            group: 'block',
            content: `tbody`,
            isolating: true,
            tableRole: TableRole.Table,
        },
        tbody: {
            group: 'block',
            content: `trow+`,
            isolating: true,
            tableRole: TableRole.Body,
        },
        trow: {
            group: 'block',
            content: `tcell+`,
            isolating: true,
            tableRole: TableRole.Row,
        },
        tcell: {
            group: 'block',
            content: 'block+',
            isolating: true,
            tableRole: TableRole.Cell,
        },
    },
});

const {
    doc,
    para: p,
    table,
    tbody,
    trow,
    tcell,
} = builders(schema) as PMTestBuilderResult<'doc' | 'para' | 'table' | 'tbody' | 'trow' | 'tcell'>;

describe('table-utils: commands', () => {
    describe('transpose', () => {
        it('should transpose square table', () => {
            const state = EditorState.create({
                schema,
                doc: doc(
                    table(
                        tbody(
                            trow(tcell(p('1')), tcell(p('2'))),
                            trow(tcell(p('3')), tcell(p('4'))),
                        ),
                    ),
                ),
            });

            const {res, tr} = applyCommand(state, transpose);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    table(
                        tbody(
                            trow(tcell(p('1')), tcell(p('3'))),
                            trow(tcell(p('2')), tcell(p('4'))),
                        ),
                    ),
                ),
            );
        });

        it('should transpose rectangular table', () => {
            const state = EditorState.create({
                schema,
                doc: doc(
                    table(
                        tbody(
                            trow(tcell(p('1')), tcell(p('2')), tcell(p('3'))),
                            trow(tcell(p('4')), tcell(p('5')), tcell(p('6'))),
                        ),
                    ),
                ),
            });

            const {res, tr} = applyCommand(state, transpose);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    table(
                        tbody(
                            trow(tcell(p('1')), tcell(p('4'))),
                            trow(tcell(p('2')), tcell(p('5'))),
                            trow(tcell(p('3')), tcell(p('6'))),
                        ),
                    ),
                ),
            );
        });

        it('should return false', () => {
            const state = EditorState.create({
                schema,
                doc: doc(p('lol')),
            });

            const dispatch = jest.fn();
            const res = transpose(state, dispatch);

            expect(res).toBe(false);
            expect(dispatch).not.toBeCalled();
        });
    });
});

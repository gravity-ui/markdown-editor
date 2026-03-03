import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {applyCommand} from '../../../../tests/utils';

import {getSchemaSpecs} from './YfmTableSpecs/schema';
import {createYfmTableCommand} from './actions';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*'},
        ...getSchemaSpecs(),
    },
});

const {doc, paragraph: p, yfm_table: t, yfm_tbody: tb, yfm_tr: trow, yfm_td: td} = builders(schema);

describe('yfmTable', () => {
    describe('createYfmTableCommand', () => {
        it('should add template yfm table', () => {
            const state = EditorState.create({
                schema,
                doc: doc(p()),
            });

            const {res, tr} = applyCommand(state, createYfmTableCommand);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(t(tb(trow(td(p('')), td(p(''))), trow(td(p('')), td(p('')))))),
            );
        });
    });
});

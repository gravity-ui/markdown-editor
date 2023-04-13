import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {getSpec} from './CheckboxSpecs/spec';
import {addCheckboxCmd} from './actions';
import {applyCommand} from '../../../../tests/utils';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*'},
        ...getSpec(),
    },
});

const {
    doc,
    paragraph: p,
    checkbox,
    checkbox_input: checkboxInput,
    checkbox_label: checkboxLabel,
} = builders(schema, {}) as PMTestBuilderResult<
    'doc' | 'paragraph' | 'checkbox' | 'checkbox_input' | 'checkbox_label'
>;

describe('checkbox', () => {
    describe('addCheckbox', () => {
        it('should add empty checkbox', () => {
            const state = EditorState.create({
                schema,
                doc: doc(p()),
            });

            const {res, tr} = applyCommand(state, addCheckboxCmd);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(doc(checkbox(checkboxInput(), checkboxLabel(''))));
        });

        it('should add checkbox with paragraph content', () => {
            const state = EditorState.create({
                schema,
                doc: doc(p('blabla')),
            });

            const {res, tr} = applyCommand(state, addCheckboxCmd);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(doc(checkbox(checkboxInput(), checkboxLabel('blabla'))));
        });

        it('should add checkbox after another checkbox', () => {
            const state = EditorState.create({
                schema,
                doc: doc(checkbox(checkboxInput(), checkboxLabel('blabla'))),
            });

            state.selection = new TextSelection(state.doc.resolve(6));

            const {res, tr} = applyCommand(state, addCheckboxCmd);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    checkbox(checkboxInput(), checkboxLabel('blabla')),
                    checkbox(checkboxInput(), checkboxLabel('')),
                ),
            );
        });
    });
});

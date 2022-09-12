import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';

import {getSpec} from './spec';
import {splitCheckbox} from './plugin';
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
} = builders(schema) as PMTestBuilderResult<
    'doc' | 'paragraph' | 'checkbox' | 'checkbox_input' | 'checkbox_label'
>;

describe('checkbox', () => {
    describe('splitCheckbox', () => {
        it('should split checkbox content', () => {
            const state = EditorState.create({
                schema,
                doc: doc(checkbox(checkboxInput(), checkboxLabel('text123'))),
            });

            state.selection = new TextSelection(state.doc.resolve(7));

            const {res, tr} = applyCommand(state, splitCheckbox);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    checkbox(checkboxInput(), checkboxLabel('text')),
                    checkbox(checkboxInput(), checkboxLabel('123')),
                ),
            );
        });

        it('should add empty checkbox if run at the end of checkbox', () => {
            const state = EditorState.create({
                schema,
                doc: doc(checkbox(checkboxInput(), checkboxLabel('text123'))),
            });

            state.selection = new TextSelection(state.doc.resolve(10));

            const {res, tr} = applyCommand(state, splitCheckbox);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(
                doc(
                    checkbox(checkboxInput(), checkboxLabel('text123')),
                    checkbox(checkboxInput(), checkboxLabel('')),
                ),
            );
        });

        it('should remove checkbox with empty content', () => {
            const state = EditorState.create({
                schema,
                doc: doc(checkbox(checkboxInput(), checkboxLabel(''))),
            });

            state.selection = new TextSelection(state.doc.resolve(3));

            const {res, tr} = applyCommand(state, splitCheckbox);

            expect(res).toBe(true);
            expect(tr.doc).toMatchNode(doc(p()));
        });
    });
});

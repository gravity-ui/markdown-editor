import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {ExtensionsManager} from '../../../core';
import {CodeSpecs, codeMarkName} from '../../markdown/Code/CodeSpecs';
import {BaseNode, BaseSchemaSpecs} from '../specs';

import {BaseInputRules} from './index';

const {schema, plugins} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(CodeSpecs).use(BaseInputRules),
}).build();

const {doc, p, c} = builders<'doc' | 'p', 'c'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    c: {nodeType: codeMarkName},
});

describe('BaseInputRules', () => {
    it('replaces triple dots with ellipsis outside code marks', () => {
        const startDoc = doc(p(''));
        const state = EditorState.create({
            schema,
            doc: startDoc,
            selection: TextSelection.create(startDoc, 1),
            plugins,
        });
        const view = new EditorView(document.createElement('div'), {state});
        const from = view.state.selection.from;
        let handled = false;
        view.someProp('handleTextInput', (f) => {
            handled = f(view, from, from, '...') || false;
        });
        if (!handled) {
            view.dispatch(view.state.tr.insertText('...', from, from));
        }
        expect(view.state.doc).toMatchNode(doc(p('…')));
        view.destroy();
    });

    it('does not replace triple dots inside inline code', () => {
        const startDoc = doc(p(c('foo')));
        const state = EditorState.create({
            schema,
            doc: startDoc,
            selection: TextSelection.create(startDoc, 4),
            plugins,
        });
        const view = new EditorView(document.createElement('div'), {state});
        const from = view.state.selection.from;
        let handled = false;
        view.someProp('handleTextInput', (f) => {
            handled = f(view, from, from, '...') || false;
        });
        if (!handled) {
            view.dispatch(view.state.tr.insertText('...', from, from));
        }
        expect(view.state.doc).toMatchNode(doc(p(c('foo...'))));
        view.destroy();
    });
});

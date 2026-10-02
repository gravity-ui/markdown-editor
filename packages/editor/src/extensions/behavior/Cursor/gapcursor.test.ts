import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {Blockquote, blockquoteNodeName} from '../../markdown/Blockquote';

import {GapCursorSelection} from './GapCursorSelection';
import {gapCursor} from './gapcursor';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Blockquote, {}),
}).buildDeps();

const {doc, p, bq} = builders<'doc' | 'p' | 'bq'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
});

// doc(bq(bq(p('Nested')))): 0 – before outer bq, 1 – inside outer bq, before nested bq
const gapCursorPos = 1;

function createView() {
    const view = new EditorView(null, {
        state: EditorState.create({
            schema,
            doc: doc(bq(bq(p('Nested')))),
            plugins: [gapCursor()],
        }),
    });
    view.dispatch(
        view.state.tr.setSelection(new GapCursorSelection(view.state.doc.resolve(gapCursorPos))),
    );
    return view;
}

const selectionBetween = (view: EditorView, pos: number) => {
    const $pos = view.state.doc.resolve(pos);
    return view.someProp('createSelectionBetween', (f) => f(view, $pos, $pos));
};

describe('gapCursor plugin', () => {
    it('should keep gap cursor when the same position is read back from dom', () => {
        const view = createView();

        expect(selectionBetween(view, gapCursorPos)).toBe(view.state.selection);
    });

    it('should not keep gap cursor when another position is read back from dom', () => {
        const view = createView();

        expect(selectionBetween(view, gapCursorPos + 2)).toBeUndefined();
    });

    it('should not affect reading text selection from dom', () => {
        const view = createView();
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 4)));

        expect(selectionBetween(view, 4)).toBeUndefined();
    });
});

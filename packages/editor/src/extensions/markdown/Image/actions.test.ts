import {AllSelection, EditorState, NodeSelection, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from 'src/core';

import {BaseSchemaSpecs} from '../../base/specs';

import {ImageSpecs} from './ImageSpecs';
import {addImage} from './actions';

const {schema, markupParser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ImageSpecs),
}).buildDeps();
const action = addImage(schema);
const attrs = {src: 'image.png'};

describe('addImage', () => {
    it.each(['all', 'node'] as const)(
        'should disable image insertion and ignore direct execution with %s selection',
        (kind) => {
            const doc = markupParser.parse('word');
            const selection = kind === 'all' ? new AllSelection(doc) : NodeSelection.create(doc, 0);
            const state = EditorState.create({doc, selection});
            const view = new EditorView(null, {state});
            const dispatch = vi.spyOn(view, 'dispatch');
            try {
                expect(action.isEnable(state, undefined, view)).toBe(false);
                action.run(state, dispatch, view, attrs);
                expect(dispatch).not.toHaveBeenCalled();
            } finally {
                view.destroy();
            }
        },
    );

    it('should insert an image at an empty text cursor', () => {
        const doc = markupParser.parse('word');
        const state = EditorState.create({doc, selection: TextSelection.create(doc, 1)});
        const view = new EditorView(null, {state});
        try {
            expect(action.isEnable(state, undefined, view)).toBe(true);
            action.run(state, view.dispatch, view, attrs);
            expect(view.state.doc.firstChild?.firstChild?.attrs.src).toBe(attrs.src);
            expect(view.state.doc.textContent).toBe('word');
            view.state.doc.check();
        } finally {
            view.destroy();
        }
    });
});

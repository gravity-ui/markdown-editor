/* eslint-disable no-implicit-globals */
import type {Node, Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {dispatchPasteEvent} from './dispatch-event';

export function parseDOM(schema: Schema, html: string, doc: Node): void {
    const view = new EditorView(null, {state: EditorState.create({schema})});
    dispatchPasteEvent(view, {'text/html': html});
    expect(view.state.doc).toMatchNode(doc);
}

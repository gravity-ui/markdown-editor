import {Fragment, Slice} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';

import {ClipboardEventMock} from '../../../../../tests/event-mock';
import {YfmTableSpecs} from '../YfmTableSpecs';

import {yfmTableTransformPastedPlugin} from './yfmTableTransformPastedPlugin';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmTableSpecs, {}),
}).buildDeps();
const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((view) => view.destroy()));

describe('YFM table paste transforms', () => {
    it.each([false, true])(
        'should preserve a full one-cell table for paste and drop only when enabled=%s',
        (enabled) => {
            const view = createView(enabled);
            let slice = new Slice(Fragment.from(table()), 0, 0);
            view.someProp('transformPasted', (transform) => {
                slice = transform(slice, view);
            });
            expect(slice.content.firstChild!.type.name).toBe(enabled ? 'yfm_table' : 'paragraph');
            expect(slice.content.firstChild!.textContent).toBe('A');
        },
    );

    it.each([1, 2, 3])('should keep unwrapping a partial table wrapper at depth %s', (depth) => {
        const view = createView(true);
        let node = table();
        for (let index = 0; index < depth; index++) node = node.firstChild!;
        let slice = new Slice(Fragment.from(node), 0, 0);
        view.someProp('transformPasted', (transform) => {
            slice = transform(slice, view);
        });
        expect(slice.content.firstChild!.type.name).toBe('paragraph');
        expect(slice.content.firstChild!.textContent).toBe('A');
    });

    it.each([
        [1, 0],
        [0, 1],
        [1, 1],
    ])('should keep ordinary unwrapping for an open table (%s, %s)', (openStart, openEnd) => {
        const view = createView(true);
        let slice = new Slice(Fragment.from(table()), openStart, openEnd);
        view.someProp('transformPasted', (transform) => {
            slice = transform(slice, view);
        });
        expect(slice.content.firstChild!.type.name).toBe('paragraph');
        expect(slice.openStart).toBe(0);
        expect(slice.openEnd).toBe(0);
    });

    it.each([false, true])(
        'should unwrap ordinary paste without the matrix clipboard handler when enabled=%s',
        (enabled) => {
            const view = createView(enabled);
            view.pasteHTML('<table><tr><td>A</td></tr></table>', new ClipboardEventMock('paste'));
            expect(
                view.state.doc.eq(
                    schema.node('doc', null, schema.node('paragraph', null, schema.text('A'))),
                ),
            ).toBe(true);
        },
    );
});

function createView(matrixEnabled: boolean): EditorView {
    const view = new EditorView(null, {
        state: EditorState.create({
            schema,
            plugins: [yfmTableTransformPastedPlugin({schema, matrixEnabled})],
        }),
    });
    views.push(view);
    return view;
}

function table() {
    return schema.node(
        'yfm_table',
        null,
        schema.node(
            'yfm_tbody',
            null,
            schema.node(
                'yfm_tr',
                null,
                schema.node('yfm_td', null, schema.node('paragraph', null, schema.text('A'))),
            ),
        ),
    );
}

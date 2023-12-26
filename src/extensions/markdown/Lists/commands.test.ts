import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {ExtensionsManager} from '../../../core';
import {get$Cursor} from '../../../utils/selection';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {ListsSpecs} from './ListsSpecs';
import {liftIfCursorIsAtBeginningOfItem} from './commands';
import {ListNode} from './const';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(ListsSpecs),
}).buildDeps();

const {
    doc,
    paragraph: p,
    list_item: li,
    bullet_list: bl,
    ordered_list: ol,
} = builders<BaseNode | ListNode>(schema);

describe('Lists commands', () => {
    it.each([
        ['bullet list', bl],
        ['ordered list', ol],
    ])('should lift item from %s', (_0, list) => {
        const document = doc(list(li(p('111')), li(p('222')), li(p('333'))));
        const view = new EditorView(null, {
            state: EditorState.create({
                doc: document,
                selection: TextSelection.create(document, 10),
            }),
        });
        const res = liftIfCursorIsAtBeginningOfItem(view.state, view.dispatch, view);
        const cursorpos = get$Cursor(view.state.selection)?.pos;
        expect(res).toStrictEqual(true);
        expect(view.state.doc).toMatchNode(doc(list(li(p('111'))), p('222'), list(li(p('333')))));
        expect(cursorpos).toStrictEqual(10);
    });
});

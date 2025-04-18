import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/BaseSchema/BaseSchemaSpecs';
import {ListsSpecs} from '../ListsSpecs';
import {ListNode} from '../const';

import {collapseListsPlugin} from './CollapseListsPlugin';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ListsSpecs),
}).buildDeps();

const {doc, p, li, ul} = builders<'doc' | 'p' | 'li' | 'ul'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    li: {nodeType: ListNode.ListItem},
    ul: {nodeType: ListNode.BulletList},
});

describe('CollapseListsPlugin', () => {
    it('should collapse nested bullet list without remaining content and move selection to the end of the first text node', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(ul(li(ul(li(p('Nested item'))))));

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(doc(ul(li(p('Nested item')))));

        const textStartPos = view.state.doc.resolve(3);
        const textEndPos = textStartPos.pos + textStartPos.nodeAfter!.nodeSize;

        expect(view.state.selection.from).toBe(textEndPos);
    });

    it('should collapse nested bullet list with remaining content', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(ul(li(ul(li(p('Nested item'))), p('Remaining text'))));

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(doc(ul(li(p('Nested item')), li(p('Remaining text')))));
    });

    it('should collapse deeply nested bullet lists', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });
        const initialDoc = doc(ul(li(ul(li(ul(li(p('Deep nested item'))))))));

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(doc(ul(li(p('Deep nested item')))));
    });

    it('should collapse multiple nested lists in a single document', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });
        const initialDoc = doc(
            ul(li(ul(li(p('Item 1 nested')))), li(p('Item 1 plain'))),
            p('Between lists'),
            ul(li(ul(li(p('Item 2 nested'))), p('Item 2 remaining'))),
        );

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(
            doc(
                ul(li(p('Item 1 nested')), li(p('Item 1 plain'))),
                p('Between lists'),
                ul(li(p('Item 2 nested')), li(p('Item 2 remaining'))),
            ),
        );
    });

    it('should correctly handle list items with mixed nested and non-nested content and move selection to the closest text node', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });
        const initialDoc = doc(
            ul(
                li(p('No nested list')),
                li(ul(li(p('Nested item 1'))), p('Extra text'), ul(li(p('Nested item 2')))),
            ),
        );

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(
            doc(
                ul(
                    li(p('No nested list')),
                    li(p('Nested item 1')),
                    li(p('Extra text'), ul(li(p('Nested item 2')))),
                ),
            ),
        );

        const textStartPos = view.state.doc.resolve(38);
        expect(view.state.selection.from).toBe(textStartPos.pos);
    });

    it('should not collapse list item without nested bullet list and not change selection if no collapse happened', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(ul(li(p('Simple item')), li(p('Another item'))));

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(doc(ul(li(p('Simple item')), li(p('Another item')))));

        const selectionPos = view.state.doc.resolve(6);
        view.dispatch(
            view.state.tr.setSelection(TextSelection.create(view.state.doc, selectionPos.pos)),
        );

        expect(view.state.selection.from).toBe(selectionPos.pos);
    });
});

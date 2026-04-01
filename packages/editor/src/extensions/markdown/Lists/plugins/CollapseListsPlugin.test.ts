import {type Node, Slice} from 'prosemirror-model';
import {AllSelection, EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {EditorView} from 'prosemirror-view';

import {ExtensionsManager} from '../../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../../base/BaseSchema/BaseSchemaSpecs';
import {ListsSpecs} from '../ListsSpecs';
import {ListNode} from '../const';

import {collapseAllNestedListItems, collapseListsPlugin} from './CollapseListsPlugin';
import {mergeListsPlugin} from './MergeListsPlugin';

const {schema, markupParser: parser} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ListsSpecs),
}).buildDeps();

const {doc, p, li, ul} = builders<'doc' | 'p' | 'li' | 'ul'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    li: {nodeType: ListNode.ListItem},
    ul: {nodeType: ListNode.BulletList},
});

describe('CollapseListsPlugin', () => {
    it('should collapse nested bullet list without remaining content and place cursor on text', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(ul(li(ul(li(p('Nested item'))))));

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(doc(ul(li(p('Nested item')))));

        const sel = view.state.selection;
        const $from = view.state.doc.resolve(sel.from);
        expect($from.parent.type.name).toBe('paragraph');
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

        const $from = view.state.doc.resolve(view.state.selection.from);
        expect($from.parent.type.name).toBe('paragraph');
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

    it('should not crash on a large bullet list with 3-level nesting from "N. M." items', () => {
        const markdown = [
            '- 1. Replied in the original ticket.',
            '- 2. Fixed the macro processing for table of contents.',
            '- 3. The heading is already H2 after import, everything is correct.',
            '- 4. Added support for this macro.',
            '- 5. Fixed processing of such quotes.',
            '- 6. Fixed processing of em dashes.',
            '- 7. 8. Replied in the original ticket.',
            '- 9. Could not reproduce, apparently the screenshot shows a placeholder for a magic link logo.',
            '- 10. In the source data items are presented as text not a list. In markdown this is considered a numbered list and indentation is automatically added. The inner list is also formatted as a first-level indented list because it is not a second-level list at the markup level. Accordingly the indentation is the same. In this case this is expected behavior.',
            '- 11. Email highlighting is standard editor behavior.',
            '- 12. Added escaping of backslashes.',
            '- 13. The code contains links as anchor tags and such links are not mapped. Only internal Confluence links are mapped.',
            '- 14. 15. Replied in the original ticket.',
            '- 16. This is a feature of how the editor works. Possibly a bug, will discuss with the team.',
            '- 17. Duplicates of previous errors.',
            '- 18. The image was inserted by link and either was not found or is not accessible.',
            '- 19. 20. Expected behavior and link highlighting.',
        ].join('\n');

        const parsedDoc = parser.parse(markdown);

        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        expect(() => {
            view.dispatch(
                view.state.tr
                    .setSelection(new AllSelection(view.state.doc))
                    .replaceSelection(new Slice(parsedDoc.content, 0, 0)),
            );
        }).not.toThrow();

        const resultDoc = view.state.doc;
        expect(hasParasiticNesting(resultDoc)).toBe(false);

        let listItemCount = 0;
        resultDoc.descendants((node) => {
            if (node.type.name === ListNode.ListItem) listItemCount++;
            return true;
        });
        expect(listItemCount).toBe(17);
    });

    it('collapseAllNestedListItems should return null when no collapsible items exist', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(ul(li(p('Plain item')), li(p('Another item'))));
        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        const {tr} = view.state;
        expect(collapseAllNestedListItems(tr)).toBeNull();
        expect(tr.docChanged).toBe(false);
    });

    it('should correctly collapse adjacent wrapped siblings', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(
            ul(
                li(ul(li(p('First wrapped')))),
                li(ul(li(p('Second wrapped')))),
                li(ul(li(p('Third wrapped')))),
            ),
        );

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(
            doc(ul(li(p('First wrapped')), li(p('Second wrapped')), li(p('Third wrapped')))),
        );
    });

    it('should correctly collapse adjacent wrapped items with remaining content', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema, plugins: [collapseListsPlugin()]}),
        });

        const initialDoc = doc(
            ul(li(ul(li(p('A'))), p('A-extra')), li(ul(li(p('B'))), p('B-extra'))),
        );

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        expect(view.state.doc).toMatchNode(
            doc(ul(li(p('A')), li(p('A-extra')), li(p('B')), li(p('B-extra')))),
        );
    });
});

describe('CollapseListsPlugin + MergeListsPlugin integration', () => {
    it('should collapse wrapped nesting and merge resulting adjacent lists', () => {
        const markdown = [
            '- 1. First item',
            '- 2. Second item',
            '',
            'Some text between',
            '',
            '- 3. Third item',
        ].join('\n');

        const parsedDoc = parser.parse(markdown);

        // register merge BEFORE collapse — same order as production (index.ts)
        const view = new EditorView(null, {
            state: EditorState.create({
                schema,
                plugins: [mergeListsPlugin(), collapseListsPlugin()],
            }),
        });

        view.dispatch(
            view.state.tr
                .setSelection(new AllSelection(view.state.doc))
                .replaceSelection(new Slice(parsedDoc.content, 0, 0)),
        );

        const resultDoc = view.state.doc;

        expect(hasParasiticNesting(resultDoc)).toBe(false);

        // count top-level bullet_list nodes — the first two items should
        // be in one list (merged), the third after the paragraph in another
        let bulletListCount = 0;
        resultDoc.forEach((child) => {
            if (child.type.name === ListNode.BulletList) bulletListCount++;
        });
        expect(bulletListCount).toBe(2);
    });

    it('should merge adjacent same-type lists produced by collapse', () => {
        // two separate bullet lists that each contain parasitic nesting
        // after collapse, the lists are adjacent and should be merged
        const view = new EditorView(null, {
            state: EditorState.create({
                schema,
                plugins: [mergeListsPlugin(), collapseListsPlugin()],
            }),
        });

        // two separate top-level bullet lists, each with parasitic nesting
        const initialDoc = doc(ul(li(ul(li(p('A'))))), ul(li(ul(li(p('B'))))));

        view.dispatch(
            view.state.tr.replaceWith(0, view.state.doc.nodeSize - 2, initialDoc.content),
        );

        const resultDoc = view.state.doc;
        expect(hasParasiticNesting(resultDoc)).toBe(false);

        // after collapse both items are flat, and merge should
        // combine the two adjacent bullet_lists into one
        let bulletListCount = 0;
        resultDoc.forEach((child) => {
            if (child.type.name === ListNode.BulletList) bulletListCount++;
        });
        expect(bulletListCount).toBe(1);

        expect(resultDoc).toMatchNode(doc(ul(li(p('A')), li(p('B')))));
    });
});

function hasParasiticNesting(node: Node): boolean {
    let found = false;
    node.descendants((child) => {
        if (found) return false;
        if (child.type.name === ListNode.ListItem && child.firstChild) {
            const fc = child.firstChild;
            if (fc.type.name === ListNode.BulletList || fc.type.name === ListNode.OrderedList) {
                found = true;
                return false;
            }
        }
        return true;
    });
    return found;
}

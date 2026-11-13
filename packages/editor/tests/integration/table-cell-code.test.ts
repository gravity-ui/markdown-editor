import codemark from 'prosemirror-codemark';
import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {describe, expect, it, vi} from 'vitest';

import {ExtensionsManager} from 'src/core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Code, codeType} from 'src/extensions/markdown/Code';
import {CodeBlockSpecs} from 'src/extensions/markdown/CodeBlock/CodeBlockSpecs';
import {setCodeBlockType} from 'src/extensions/markdown/CodeBlock/commands';
import {TableNode, TableSpecs} from 'src/extensions/markdown/Table/TableSpecs';
import {createMarkdownTableGeometry} from 'src/extensions/markdown/Table/geometry';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {TableCellSelection, getTableGeometry} from 'src/table-utils/cell-selection';

describe('Code with table cell selection', () => {
    const {schema, markupParser, plugins} = new ExtensionsManager({
        extensions: (builder) =>
            builder
                .use(BaseSchemaSpecs, {})
                .use(Code, {})
                .use(TableSpecs)
                .overrideNodeSpec(TableNode.Table, (spec) => ({
                    ...spec,
                    tableGeometry: createMarkdownTableGeometry,
                }))
                .use(YfmTable, {controls: false}),
    }).build();

    const original = codemark({markType: codeType(schema)});
    const keyboardPlugin = plugins.find((plugin) => plugin.spec.key === original[0].spec.key)!;

    it.each([
        '| one | two |\n| --- | --- |\n| a | b |',
        '#|\n|| one | two ||\n|#',
        '#|\n|| | ||\n|#',
    ])('should pass backticks through cell selection in %s', (markup) => {
        const doc = markupParser.parse(markup);
        const geometry = getTableGeometry(doc.firstChild!)!;
        for (const head of [geometry.cellAt(0, 0)!, geometry.cellAt(0, 1)!]) {
            const state = EditorState.create({
                doc,
                plugins,
                selection: TableCellSelection.create(
                    doc,
                    geometry.cellAt(0, 0)!.offset,
                    head.offset,
                ),
            });
            const view = new EditorView(null, {state});
            try {
                const handled = keyboardPlugin.props.handleKeyDown!.call(
                    keyboardPlugin,
                    view,
                    new KeyboardEvent('keydown', {key: '`'}),
                );
                expect(handled).toBe(false);
                expect(view.state.doc.eq(doc)).toBe(true);
                expect(view.state.selection.eq(state.selection)).toBe(true);
            } finally {
                view.destroy();
            }
        }
    });
});

describe('CodeBlock with table cell selection', () => {
    const deps = new ExtensionsManager({
        extensions: (builder) =>
            builder.use(BaseSchemaSpecs, {}).use(CodeBlockSpecs, {}).use(YfmTable, {}),
    }).buildDeps();
    const command = setCodeBlockType(deps);

    const markup = '#|\n|| one | two ||\n|#';

    it.each([false, true])('should reject cell selections with empty content: %s', (empty) => {
        const doc = deps.markupParser.parse(empty ? '#|\n|| | ||\n|#' : markup);
        const table = doc.firstChild!;
        const geometry = getTableGeometry(table)!;
        for (const head of [geometry.cellAt(0, 0)!, geometry.cellAt(0, 1)!]) {
            const state = EditorState.create({
                doc,
                selection: TableCellSelection.create(
                    doc,
                    geometry.cellAt(0, 0)!.offset,
                    head.offset,
                ),
            });
            const dispatch = vi.fn();
            expect(command(state)).toBe(false);
            expect(command(state, dispatch)).toBe(false);
            expect(dispatch).not.toHaveBeenCalled();
        }
    });

    it('should preserve text editing inside a YFM cell', () => {
        const doc = deps.markupParser.parse(markup);
        const cell = getTableGeometry(doc.firstChild!)!.cellAt(0, 0)!;
        let state = EditorState.create({
            doc,
            selection: TextSelection.create(doc, cell.offset + 2),
        });
        expect(
            command(state, (tr) => {
                state = state.apply(tr);
            }),
        ).toBe(true);
        expect(
            getTableGeometry(state.doc.firstChild!)!.cellAt(0, 0)!.node.firstChild!.type.name,
        ).toBe('code_block');
        state.doc.check();
    });
});

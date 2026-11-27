import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {assert, describe, expect, it} from 'vitest';

import {ExtensionsManager} from 'src/core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {Table} from 'src/extensions/markdown/Table';
import {Color, colorType} from 'src/extensions/yfm/Color';
import {YfmTable} from 'src/extensions/yfm/YfmTable';
import {TableCellSelection, getTableGeometry} from 'src/table-utils/cell-selection';

const {schema, markupParser, rawActions} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(Color).use(Table).use(YfmTable, {controls: false}),
}).build();
const action = rawActions.colorify;

for (const kind of ['Markdown', 'YFM'] as const) {
    describe(`Color action with ${kind} cells`, () => {
        it('should report mixed colors across selected ranges', () => {
            const state = createState(kind, 'red', 'blue');

            expect(action.meta?.(state)).toBeNull();
            expect(action.isActive?.(state)).toBe(true);
        });

        it('should report mixed colored and plain content', () => {
            expect(action.meta?.(createState(kind, 'red'))).toBeNull();
        });

        it('should report one color for uniformly colored ranges', () => {
            expect(action.meta?.(createState(kind, 'red', 'red'))).toBe('red');
        });

        it('should report no color for plain ranges', () => {
            expect(action.meta?.(createState(kind))).toBeUndefined();
        });

        it('should set the requested color across mixed ranges', () => {
            const state = runColor(createState(kind, 'red', 'blue'), 'red');

            expect(selectedColors(state)).toEqual(['red', 'red']);
            expect(outsideColors(state)).toEqual(['green', 'green']);
            state.doc.check();
        });

        it('should keep the color when the action runs with the same color', () => {
            const state = runColor(createState(kind, 'red', 'red'), 'red');

            expect(selectedColors(state)).toEqual(['red', 'red']);
        });

        it('should clear every selected color including a plain head range', () => {
            const state = runColor(createState(kind, 'red'), '');

            expect(selectedColors(state)).toEqual([undefined, undefined]);
            expect(outsideColors(state)).toEqual(['green', 'green']);
            expect(state.selection).toBeInstanceOf(TableCellSelection);
        });
    });
}

function createState(kind: 'Markdown' | 'YFM', first?: string, second?: string) {
    const firstCell = first ? `{${first}}(x)` : 'x';
    const secondCell = second ? `{${second}}(x)` : 'x';
    const doc = markupParser.parse(
        kind === 'Markdown'
            ? `| {green}(x) | {green}(x) |\n| --- | --- |\n| ${firstCell} | {green}(x) |\n| ${secondCell} | {green}(x) |`
            : `#|\n|| {green}(x) | {green}(x) ||\n|| ${firstCell} | {green}(x) ||\n|| ${secondCell} | {green}(x) ||\n|#`,
    );
    const geometry = getTableGeometry(doc.firstChild!);
    assert(geometry);
    const anchor = geometry.cellAt(1, 0);
    const head = geometry.cellAt(2, 0);
    assert(anchor && head);
    return EditorState.create({
        doc,
        selection: TableCellSelection.create(doc, anchor.offset, head.offset),
    });
}

function runColor(state: EditorState, color: string) {
    const view = new EditorView(null, {state});
    try {
        action.run(view.state, view.dispatch, view, {color});
        return view.state;
    } finally {
        view.destroy();
    }
}

function selectedColors(state: EditorState) {
    return state.selection.ranges.map(({$from, $to}) => {
        let color: string | undefined;
        state.doc.nodesBetween($from.pos, $to.pos, (node) => {
            if (node.isText) color = colorType(schema).isInSet(node.marks)?.attrs.color;
        });
        return color;
    });
}

function outsideColors(state: EditorState) {
    const table = state.doc.firstChild;
    assert(table);
    const geometry = getTableGeometry(table);
    assert(geometry);
    return [1, 2].map((row) => {
        let color: string | undefined;
        const cell = geometry.cellAt(row, 1);
        assert(cell);
        cell.node.descendants((node) => {
            if (node.isText) color = colorType(schema).isInSet(node.marks)?.attrs.color;
        });
        return color;
    });
}

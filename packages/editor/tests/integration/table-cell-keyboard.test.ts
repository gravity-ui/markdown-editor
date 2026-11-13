import {EditorState, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';
import {BaseSchemaSpecs} from 'src/extensions/base/specs';
import {
    TableCellSelection,
    TableCellSelectionExtension,
} from 'src/extensions/behavior/TableCellSelection';
import {CodeBlockSpecs} from 'src/extensions/markdown/CodeBlock/CodeBlockSpecs';
import {Lists} from 'src/extensions/markdown/Lists';
import {YfmTable} from 'src/extensions/yfm/YfmTable';

const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((view) => view.destroy()));

describe('Table cell selection keyboard integration', () => {
    it('should keep list indentation and lifting before table navigation', () => {
        const view = createView('- A\n- B', 'B');
        const before = view.state.doc;
        expect(pressTab(view)).toBe(true);
        const lists: {items: number; text: string}[] = [];
        view.state.doc.descendants((node) => {
            if (node.type.name === 'bullet_list')
                lists.push({items: node.childCount, text: node.textContent});
        });
        expect(lists).toEqual([
            {items: 1, text: 'AB'},
            {items: 1, text: 'B'},
        ]);
        expect(view.state.selection).toBeInstanceOf(TextSelection);
        expect(pressTab(view, true)).toBe(true);
        expect(view.state.doc.eq(before)).toBe(true);
    });

    it('should insert a tab in CodeBlock without selecting another cell', () => {
        const view = createView('```\nx\n```', 'x');
        expect(pressTab(view)).toBe(true);
        expect(view.state.doc.textContent).toBe('x\tnext');
        expect(view.state.selection).toBeInstanceOf(TextSelection);
        expect(view.state.selection.$head.parent.type.spec.code).toBe(true);
    });

    it('should select the next cell when list indentation is unavailable', () => {
        const view = createView('- A\n- B', 'A');
        const before = view.state.doc;
        expect(pressTab(view)).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect(view.state.doc.textBetween(view.state.selection.from, view.state.selection.to)).toBe(
            'next',
        );
        expect(view.state.doc.eq(before)).toBe(true);
    });

    it('should select the next cell before the old table keymap', () => {
        const view = createView('first', 'first');
        expect(pressTab(view)).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TableCellSelection);
        expect(view.state.doc.textBetween(view.state.selection.from, view.state.selection.to)).toBe(
            'next',
        );
    });

    it('should retain the old text selection when cell selection is disabled', () => {
        const view = createView('first', 'first', false);
        expect(pressTab(view)).toBe(true);
        expect(view.state.selection).toBeInstanceOf(TextSelection);
        expect(view.state.doc.textBetween(view.state.selection.from, view.state.selection.to)).toBe(
            'next',
        );
    });
});

function createView(markup: string, cursorText: string, enabled = true) {
    const {schema, markupParser, plugins} = new ExtensionsManager({
        extensions: (builder) => {
            builder
                .use(BaseSchemaSpecs, {})
                .use(Lists, {})
                .use(CodeBlockSpecs, {})
                .use(YfmTable, {controls: false});
            if (enabled) builder.use(TableCellSelectionExtension);
        },
    }).build();
    const doc = schema.node(
        'doc',
        null,
        schema.node(
            'yfm_table',
            null,
            schema.node(
                'yfm_tbody',
                null,
                schema.node('yfm_tr', null, [
                    schema.node('yfm_td', null, markupParser.parse(markup).content),
                    schema.node(
                        'yfm_td',
                        null,
                        schema.node('paragraph', null, schema.text('next')),
                    ),
                ]),
            ),
        ),
    );
    let cursor = 0;
    doc.descendants((node, pos) => {
        if (node.isText && node.text === cursorText) cursor = pos + node.nodeSize;
    });
    const view = new EditorView(null, {
        state: EditorState.create({doc, plugins, selection: TextSelection.create(doc, cursor)}),
    });
    views.push(view);
    return view;
}

function pressTab(view: EditorView, shiftKey = false) {
    return Boolean(
        view.someProp('handleKeyDown', (handler) =>
            handler(view, new KeyboardEvent('keydown', {key: 'Tab', shiftKey})),
        ),
    );
}

import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {BaseSchemaSpecs, ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {SectionSpecs} from './SectionSpecs';
import {
    insertSection,
    resizeSectionColumns,
    setSectionColumnBackground,
    setSectionColumns,
    setSectionSetting,
} from './commands';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(ListsSpecs).use(SectionSpecs),
}).buildDeps();

describe('Section editor', () => {
    it('should round trip layout options and editable blocks through Markdown', () => {
        const source = `::::section{padding="l" gap="2" rounded="s"}

:::column{size="5" background="blue"}

One

:::

:::column{size="7" background="green"}

- Two

:::

::::`;
        const doc = markupParser.parse(source);
        const section = doc.child(0);
        expect(section.attrs).toEqual({padding: 'l', gap: '2', rounded: 's'});
        expect(section.child(0).attrs).toEqual({size: 5, background: 'blue'});
        expect(section.child(1).attrs).toEqual({size: 7, background: 'green'});
        expect(sizes(section)).toEqual([5, 7]);
        expect(doc.textContent).toBe('OneTwo');
        expect(markupParser.parse(serializer.serialize(doc)).eq(doc)).toBe(true);
    });

    it('should preserve the effect of legacy boolean settings', () => {
        const source = `::::section{padding="true" rounded="false"}
:::column{size="12"}
Text
:::
::::`;
        const doc = markupParser.parse(source);
        expect(doc.child(0).attrs).toEqual({padding: 'm', gap: '5', rounded: null});
        expect(serializer.serialize(doc)).toContain('::::section{padding="m" gap="5"}');
    });

    it('should insert three columns and resize only the adjacent pair in one undo step', () => {
        const editor = createEditor('');
        expect(editor.run(insertSection)).toBe(true);
        expect(editor.state.selection.$from.index(1)).toBe(0);
        expect(sizes(editor.section)).toEqual([4, 4, 4]);
        expect(editor.section.attrs.rounded).toBeNull();
        expect(editor.run(resizeSectionColumns(0, 0, [5, 3], [4, 4]))).toBe(true);
        expect(sizes(editor.section)).toEqual([5, 3, 4]);
        expect(editor.run(undo)).toBe(true);
        expect(sizes(editor.section)).toEqual([4, 4, 4]);
    });

    it('should keep gap, padding and column background independent', () => {
        const editor = createEditor('');
        editor.run(insertSection);
        editor.run(setSectionSetting(0, 'gap', '3'));
        editor.run(setSectionColumnBackground(0, 1, 'violet'));
        editor.run(setSectionSetting(0, 'padding', 's'));
        editor.run(setSectionSetting(0, 'padding', null));

        expect(editor.section.attrs).toEqual({padding: null, gap: '3', rounded: null});
        expect(
            Array.from({length: 3}, (_, index) => editor.section.child(index).attrs.background),
        ).toEqual(['none', 'violet', 'none']);
    });

    it('should reset widths on count changes and keep nonempty columns', () => {
        const editor = createEditor('');
        editor.run(insertSection);
        editor.run(resizeSectionColumns(0, 0, [5, 3], [4, 4]));
        expect(editor.run(setSectionColumns(0, 4))).toBe(true);
        expect(sizes(editor.section)).toEqual([3, 3, 3, 3]);

        const lastColumnText = editor.section.nodeSize - 3;
        editor.insertText('Keep', lastColumnText);
        expect(editor.run(setSectionColumns(0, 3))).toBe(false);
        expect(editor.section.lastChild?.textContent).toBe('Keep');
    });
});

function sizes(section: Node) {
    return Array.from({length: section.childCount}, (_, index) => section.child(index).attrs.size);
}

function createEditor(markup: string) {
    let state = EditorState.create({doc: markupParser.parse(markup), schema, plugins: [history()]});
    return {
        get state() {
            return state;
        },
        get section() {
            return state.doc.child(0);
        },
        run(command: Command) {
            return command(state, (tr) => {
                state = state.apply(tr);
            });
        },
        insertText(text: string, pos: number) {
            state = state.apply(state.tr.insertText(text, pos));
        },
    };
}

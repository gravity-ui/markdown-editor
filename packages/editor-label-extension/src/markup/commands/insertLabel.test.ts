import {EditorSelection, EditorState} from '@gravity-ui/markdown-editor/cm/state';
import {labelPlugin} from '@gravity-ui/markdown-plugin-label';
import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {insertLabel} from './insertLabel';

const md = new MarkdownIt().use(labelPlugin);

const run = (doc: string, selection: EditorSelection) => {
    let state = EditorState.create({
        doc,
        selection,
        extensions: EditorState.allowMultipleSelections.of(true),
    });
    insertLabel({
        state,
        dispatch: (tr) => {
            state = tr.state;
        },
    });
    return state;
};

const captionOf = (markup: string) => {
    const [, inline] = md.parse(markup, {});
    return inline.children?.find((token) => token.type === 'label')?.content;
};

describe('insertLabel markup command', () => {
    it('should insert empty brackets and put the cursor inside them', () => {
        const state = run('a b', EditorSelection.single(2));

        expect(state.doc.toString()).toBe('a :label[]b');
        expect(state.selection.main).toEqual(EditorSelection.cursor(9));
    });

    it('should wrap the selection and keep it selected', () => {
        const state = run('a Done b', EditorSelection.single(2, 6));

        expect(state.doc.toString()).toBe('a :label[Done] b');
        expect(state.selection.main).toEqual(EditorSelection.range(9, 13));
    });

    it.each([
        ['a]b', ':label[a\\]b]', 'a]b'],
        ['[x', ':label[\\[x]', '[x'],
        ['a\\]b', ':label[a\\]b]', 'a]b'],
        ['a\\\\]b', ':label[a\\\\\\]b]', 'a\\]b'],
    ])('should escape the bracket in the selected text %j', (text, markup, caption) => {
        const state = run(text, EditorSelection.single(0, text.length));

        expect(state.doc.toString()).toBe(markup);
        expect(state.sliceDoc(state.selection.main.from, state.selection.main.to)).toBe(
            markup.slice(':label['.length, -1),
        );
        expect(captionOf(state.doc.toString())).toBe(caption);
    });

    it('should wrap each selection range', () => {
        const state = run(
            'one two',
            EditorSelection.create([EditorSelection.range(0, 3), EditorSelection.range(4, 7)]),
        );

        expect(state.doc.toString()).toBe(':label[one] :label[two]');
    });
});

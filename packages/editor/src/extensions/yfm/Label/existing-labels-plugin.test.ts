import {history, redo, undo} from 'prosemirror-history';
import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {labelNodeName, labelNodeSpec} from './LabelSpecs';
import {
    existingLabelsPlugin,
    getExistingLabels,
    getSuggestedLabels,
} from './existing-labels-plugin';

const schema = new Schema({
    nodes: {
        doc: {content: 'paragraph+'},
        paragraph: {content: 'inline*'},
        text: {group: 'inline'},
        [labelNodeName]: labelNodeSpec,
    },
});
const label = (text: string, color = 'gray') => schema.nodes.label.create({text, color});
const createState = (...labels: ReturnType<typeof label>[]) =>
    EditorState.create({
        schema,
        doc: schema.nodes.doc.create(null, schema.nodes.paragraph.create(null, labels)),
        plugins: [existingLabelsPlugin(), history()],
    });

describe('Existing labels', () => {
    it('should normalize aliases and captions, retain different colors, and ignore blank labels', () => {
        const state = createState(
            label('Ready', 'blue'),
            label(' ready ', 'teal'),
            label('Ready', 'green'),
            label(''),
            label('  '),
        );
        expect(getSuggestedLabels(state, -1)).toEqual([
            {text: 'Ready', color: 'blue'},
            {text: 'Ready', color: 'green'},
        ]);
    });
    it('should exclude the current normalized pair and equivalent labels elsewhere', () => {
        const state = createState(label('Ready', 'blue'), label(' ready ', 'teal'), label('Other'));
        expect(getSuggestedLabels(state, 1)).toEqual([{text: 'Other', color: 'gray'}]);
    });
    it('should cache occurrences through selection and metadata changes', () => {
        let state = createState(label('Ready'));
        const cached = getExistingLabels(state);
        state = state.apply(
            state.tr.setSelection(TextSelection.create(state.doc, 2)).setMeta('test', true),
        );
        expect(getExistingLabels(state)).toBe(cached);
    });
    it('should update after insertion, renaming, removal, undo and redo', () => {
        let state = createState(label('Old'));
        const dispatch = (tr: Parameters<typeof state.apply>[0]) => {
            state = state.apply(tr);
        };
        dispatch(state.tr.insert(2, label('New', 'red')));
        expect(getSuggestedLabels(state, -1)).toHaveLength(2);
        dispatch(state.tr.setNodeMarkup(1, undefined, {text: 'Renamed', color: 'green'}));
        expect(getSuggestedLabels(state, -1)[0]).toEqual({text: 'Renamed', color: 'green'});
        dispatch(state.tr.delete(1, 2));
        expect(getSuggestedLabels(state, -1)).toEqual([{text: 'New', color: 'red'}]);
        expect(undo(state, dispatch)).toBe(true);
        expect(getSuggestedLabels(state, -1)).toEqual([{text: 'Old', color: 'gray'}]);
        expect(redo(state, dispatch)).toBe(true);
        expect(getSuggestedLabels(state, -1)).toEqual([{text: 'New', color: 'red'}]);
    });
    it('should rank by distance, cap at twenty, and isolate documents', () => {
        const state = createState(...Array.from({length: 25}, (_, i) => label(String(i))));
        const suggestions = getSuggestedLabels(state, 25);
        expect(suggestions).toHaveLength(20);
        expect(suggestions[0].text).toBe('23');
        expect(getSuggestedLabels(createState(label('Elsewhere')), -1)).toEqual([
            {text: 'Elsewhere', color: 'gray'},
        ]);
    });
});

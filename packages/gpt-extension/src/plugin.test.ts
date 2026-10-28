import {createElement} from 'react';

import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it, vi} from 'vitest';

import {runGpt} from './commands';
import type {WysiwygGptHost} from './host';
import {gptWidgetPlugin} from './plugin';
import {pluginKey} from './plugin-key';

const schema = new Schema({
    nodes: {doc: {content: 'paragraph+'}, paragraph: {content: 'text*'}, text: {}},
});
const host: WysiwygGptHost = {
    getRenderer: () => ({createItem: () => ({remove: vi.fn(), rerender: vi.fn()})}),
    parse: (text) => schema.node('doc', null, [schema.node('paragraph', null, schema.text(text))]),
    serialize: (doc) => doc.textContent,
};

describe('GPT WYSIWYG state', () => {
    it('should preserve the original selected range without mutating options', () => {
        const options = Object.freeze({
            host,
            answerRender: () => createElement('div'),
            onCustomPromptApply: async () => undefined,
        });
        let state = EditorState.create({
            schema,
            doc: host.parse('original'),
            plugins: [gptWidgetPlugin(options)],
        });
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1, 5)));
        runGpt(state, (tr) => {
            state = state.apply(tr);
        });
        expect(
            pluginKey
                .getState(state)
                ?.decorations.find()
                .map(({from, to}) => ({from, to})),
        ).toEqual([{from: 1, to: 5}]);
        expect(pluginKey.getState(state)?.disablePromptPresets).toBe(false);
        state = state.apply(state.tr.insertText('changed', 1));
        expect(pluginKey.getState(state)?.decorations.find()).toEqual([]);
    });

    it('should close on selection changes and keep empty-selection state local to each editor', () => {
        const options = {
            host,
            answerRender: () => createElement('div'),
            onCustomPromptApply: async () => undefined,
        };
        const second = EditorState.create({
            schema,
            doc: host.parse('second'),
            plugins: [gptWidgetPlugin(options)],
        });
        let first = EditorState.create({
            schema,
            doc: host.parse('first'),
            plugins: [gptWidgetPlugin(options)],
        });
        runGpt(first, (tr) => {
            first = first.apply(tr);
        });
        expect(pluginKey.getState(first)?.disablePromptPresets).toBe(true);
        expect(pluginKey.getState(second)?.disablePromptPresets).toBe(false);
        first = first.apply(first.tr.setSelection(TextSelection.create(first.doc, 2)));
        expect(pluginKey.getState(first)?.decorations.find()).toEqual([]);
    });
});
